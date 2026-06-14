# Fase 3 — Arquitetura Operacional da IA Bárbara

> Documento técnico de planejamento. **Nada será implementado** até aprovação explícita deste desenho.
> Premissa central: a Fase 2 já entregou todo o substrato (tabelas, contexto-360, KB, handoff, tarefas, inbox). A Fase 3 apenas **pluga** Evolution + N8N + OpenAI sobre esse substrato, sem alterar schema.

---

## 1. Visão geral — Fluxo WhatsApp → Evolution → N8N → OpenAI → CRM

```text
┌──────────────┐   webhook    ┌──────────────┐   HTTP    ┌──────────────┐
│  WhatsApp    │ ───────────▶ │ Evolution API│ ────────▶ │     N8N      │
│  (cliente)   │              │  (gateway)   │           │ (orquestrador)│
└──────────────┘              └──────────────┘           └──────┬───────┘
        ▲                                                        │
        │ resposta                                               │ 1. POST mensagens_canal (in)
        │                                                        │ 2. GET  /v1/contexto/lead
        │                                                        │ 3. GET  ia_knowledge_base (filtrado)
        │                                                        │ 4. POST OpenAI (prompt + contexto)
        │                                                        │ 5. POST ia_interacoes
        │                                                        │ 6. Decisão: responder | handoff | tarefa
        │                                                        ▼
┌──────────────┐   send msg   ┌──────────────┐   service  ┌──────────────┐
│  WhatsApp    │ ◀─────────── │ Evolution API│ ◀───────── │ Lovable Cloud│
│  (cliente)   │              │              │  role key  │  (Supabase)  │
└──────────────┘              └──────────────┘            └──────────────┘
```

**Princípio:** N8N é o único ponto que fala com OpenAI. Evolution só transporta. CRM (Lovable Cloud) é fonte da verdade e nunca chama LLM diretamente.

---

## 2. Fluxo de entrada de mensagem

```text
WhatsApp → Evolution webhook → N8N node "Webhook In"
  ├─ normaliza payload (telefone E.164, texto, mídia, timestamp)
  ├─ resolve lead_id por telefone (POST /rpc/resolver_lead_por_telefone)
  │     ├─ existe → usa lead_id
  │     └─ não existe → cria lead minimal (origem=whatsapp, etapa=novo)
  ├─ INSERT mensagens_canal { canal:'whatsapp', direcao:'in', lead_id, autor:'cliente', conteudo }
  │     └─ trigger trg_msg_bump_lead atualiza leads.ultima_interacao_at
  └─ dispara branch "decisão IA" (item 9/10)
```

SLA alvo: < 3s da entrega WhatsApp até gravação em `mensagens_canal`.

---

## 3. Fluxo de consulta ao Contexto 360

```text
N8N (HTTP Request)
  GET https://<cloud>/functions/v1/contexto-360/v1/contexto/lead?id=<uuid>
  Headers:
    x-api-key:  $IA_BARBARA_API_KEY    ← service-to-service (Bloco final Fase 2)
    x-cliente:  n8n
  ↓
  Resposta jsonb v1 (resumo_executivo, lead, reserva, participantes, pagamentos,
                     financeiro, tarefas_abertas, handoffs_abertos,
                     ultimas_interacoes, contexto_temporal, memoria_lead,
                     conhecimento_aplicavel[])
  ↓
  Cache curto em N8N (TTL 60s por lead_id) para evitar reconsulta no mesmo turno.
```

Auditoria: cada chamada já é gravada em `contexto_acessos`.

---

## 4. Fluxo de consulta à Base de Conhecimento

Dois modos:

1. **Implícito (recomendado v1):** KB já vem embutida em `contexto-360.conhecimento_aplicavel` (filtrada por expedição + idioma + escopo).
2. **Explícito (v2 com embeddings):** N8N chama endpoint `/v1/kb/buscar?q=<texto>&expedicao_id=...` que faz busca textual (`ts_vector`) e, futuramente, vetorial (`pgvector`).

Campos já preparados na Fase 2 para uso futuro sem refactor:
`score_relevancia`, `ultima_utilizacao`, `total_utilizacoes`.

Toda KB consumida em uma resposta é registrada em `ia_interacoes.contexto_usado.kb_ids[]`.

---

## 5. Fluxo de atualização de leads

A IA **nunca** faz UPDATE direto em `leads`. Usa RPCs nomeados e auditáveis:

```text
ia_atualizar_temperatura(lead_id, temperatura, motivo)
ia_avancar_etapa(lead_id, nova_etapa, motivo)
ia_registrar_objecao(lead_id, objecao)
ia_anexar_memoria(lead_id, chave, valor)   → escreve em lead_memoria
```

Cada RPC:
- valida transição permitida (mesma máquina de estados do operador),
- grava `lead_atividades` com `origem='ia'`,
- respeita RLS via `IA_BARBARA_API_KEY` mapeada a um role técnico `ia_service`.

---

## 6. Fluxo de criação de tarefas

```text
N8N decisão: "precisa de ação humana assíncrona"
  → POST /rpc/ia_criar_tarefa({
      lead_id, reserva_id?, titulo, descricao,
      prioridade, prazo, responsavel?, origem:'ia'
    })
  → INSERT tarefas (origem='ia', criado_por='barbara')
  → Notifica responsável (já existe canal de notificações)
```

A IA pode criar, **não pode concluir** tarefas humanas. Pode concluir apenas tarefas de origem `ia` que ela mesma abriu.

---

## 7. Fluxo de handoff humano

```text
Gatilhos automáticos (regras determinísticas no N8N, antes mesmo da LLM):
  - confiança < limite configurado em ia_configuracoes.confianca_minima
  - tópicos sensíveis (reembolso, reclamação, jurídico, emergência médica)
  - cliente pediu humano explicitamente ("falar com atendente", "humano", etc.)
  - 3+ mensagens sem entender intenção
  - fora do horário operante e assunto não-FAQ
  - valor > teto autônomo (ex.: alteração financeira)

Ação:
  POST /rpc/ia_abrir_handoff({
    lead_id, reserva_id?, motivo, prioridade, origem:'ia',
    contexto_snapshot: <jsonb resumido>
  })
  → INSERT ia_handoff_queue (status='pendente', sla_at = now()+8h)
  → IA envia mensagem-ponte ao cliente ("um humano vai te atender em instantes")
  → Para de responder até handoff ser resolvido
```

---

## 8. Fluxo de atualização de reservas

Mesmo princípio do item 5: somente via RPC.

```text
ia_solicitar_alteracao_reserva(reserva_id, campo, novo_valor, motivo)
  └─ se campo ∈ whitelist segura (observacao, preferencias, idioma_atendimento)
        → aplica direto + log
     senão
        → cria handoff prioridade 'alta' + tarefa "Aprovar alteração"
```

A IA **nunca** muda: `valor_total`, `status_operacional`, `status_financeiro`, `data_id`, `quantidade_participantes`, `vagas`. Esses são sempre handoff.

---

## 9. Casos em que a IA pode agir sozinha

- Responder dúvidas cobertas pela KB (categoria=FAQ, política, expedição) com confiança ≥ limite.
- Enviar materiais (PDF de expedição, link de pagamento já existente, roteiro).
- Confirmar recebimento e dar previsão de retorno.
- Coletar dados do lead (nome, idioma, expedição de interesse, datas) e gravar via RPC.
- Agendar follow-up (cria tarefa para si mesma).
- Atualizar temperatura do lead com base em sinais explícitos.
- Reagir a confirmações simples ("ok", "obrigado", "perfeito").

---

## 10. Casos com handoff obrigatório

- Negociação de preço, desconto, parcelamento fora do padrão.
- Reembolso, cancelamento, remarcação com impacto financeiro.
- Reclamação, insatisfação, menção a Procon/jurídico.
- Emergência médica, segurança, acidente.
- Pagamento com problema (estorno, divergência).
- Alteração de participantes em reserva confirmada.
- Cliente VIP ou flag `requer_atencao_humana=true`.
- Idioma fora dos suportados pela KB.
- Confiança da resposta < `ia_configuracoes.confianca_minima`.
- Modo da Bárbara em `sombra` ou `sugestao` → sempre humano envia.

---

## 11. Estrutura de prompts

Camadas (montadas pelo N8N, não hard-coded na OpenAI):

```text
[SYSTEM]
  - Identidade Bárbara (nome, papel, tom)  ← ia_configuracoes
  - Política operacional (o que pode/não pode — itens 9 e 10)
  - Formato de saída obrigatório (JSON):
      { resposta_cliente, confianca, intencao,
        acoes:[{tipo, args}], precisa_handoff, motivo_handoff }

[CONTEXT]
  - resumo_executivo do contexto-360
  - últimas N mensagens (janela deslizante, default 20)
  - tarefas/handoffs abertos
  - memoria_lead (preferências persistentes)
  - até K itens de KB aplicáveis (top-K por prioridade)

[USER]
  - mensagem atual do cliente

[GUARDRAILS]
  - lembrete: nunca prometa preço, data ou disponibilidade fora do contexto
  - lembrete: responda no idioma do lead
```

Versionamento de prompt em `ia_configuracoes.prompt_versao` + tabela `ia_prompts_versao` (nova, prevista).

---

## 12. Estrutura de memória

Três camadas:

| Camada | Onde | TTL | Conteúdo |
|---|---|---|---|
| Curto prazo (turno) | payload do request | 1 request | últimas 20 mensagens + contexto-360 |
| Médio prazo (conversa) | `lead_conversas` | enquanto lead ativo | resumo rolante da conversa atual |
| Longo prazo (perfil) | `lead_memoria` | permanente | preferências, restrições, histórico de objeções, idioma |

Atualização de longo prazo só por RPC `ia_anexar_memoria` (auditável).

---

## 13. Estrutura de logs

- `ia_interacoes` — toda chamada à LLM: `modelo`, `prompt_versao`, `tokens_in`, `tokens_out`, `latencia_ms`, `confianca`, `contexto_usado` (jsonb), `resposta_bruta`, `acoes_executadas`.
- `mensagens_canal` — toda mensagem in/out (já existe).
- `contexto_acessos` — toda leitura do contexto-360 (já existe).
- `webhooks_eventos` — payload Evolution recebido (já existe).
- N8N: logs de execução por workflow (retidos 30 dias).
- Edge function logs: erros e timeouts.

---

## 14. Estrutura de auditoria

- View `vw_ia_auditoria_diaria`: mensagens, interações, handoffs, tarefas criadas pela IA, custo estimado, taxa de handoff, confiança média.
- View `vw_ia_decisoes_criticas`: toda ação da IA em campos sensíveis (financeiro, reserva, lead).
- Trilha imutável: `ia_interacoes` não permite UPDATE/DELETE (apenas INSERT) — política RLS.
- Revisão semanal sugerida: amostra aleatória de 50 interações `autor='ia'` revisada por supervisor humano e marcada `revisao_humana_ok|nok`.

---

## 15. Custos estimados de operação

Premissas (ajustáveis):
- Volume alvo: 1.500 mensagens/mês na fase piloto, 8.000/mês em regime.
- Modelo principal: `gpt-5.2-mini` (ou equivalente custo-eficiente) para classificação + resposta padrão.
- Modelo fallback: `gpt-5.2` para casos complexos (~10% dos turnos).
- Tokens médios por turno: 3.500 in (contexto+KB) + 350 out.

| Item | Piloto (1.5k msg) | Regime (8k msg) |
|---|---|---|
| OpenAI mini (90%) | ~US$ 8 | ~US$ 42 |
| OpenAI full (10%) | ~US$ 12 | ~US$ 64 |
| Evolution API (instância) | US$ 25 | US$ 25–60 |
| N8N (self-host ou cloud starter) | US$ 0–20 | US$ 20–50 |
| Lovable Cloud (edge invocations) | incluso | incluso |
| **Total estimado/mês** | **~US$ 45–65** | **~US$ 150–220** |

Controles:
- `ia_configuracoes.budget_mensal_usd` + alerta em 80%.
- Hard-stop quando estourar (passa tudo a handoff).
- Cache de KB e contexto-360 por lead (TTL 60s).

---

## 16. Estratégia de ambiente de testes antes da produção

Quatro estágios obrigatórios:

1. **Sandbox isolado**
   - Instância Evolution separada + número WhatsApp dedicado de teste.
   - Workflows N8N em projeto "barbara-staging".
   - `IA_BARBARA_API_KEY` distinta apontando para o **mesmo** Cloud (Fase 2 já é único), porém com flag `ia_configuracoes.modo='sombra'`.

2. **Modo sombra (shadow mode)**
   - IA gera resposta mas **não envia**. Apenas grava em `ia_interacoes` com `enviada=false`.
   - Operador compara resposta humana vs sugestão IA. Mínimo 200 turnos antes de avançar.
   - Métrica de aceite: ≥ 85% das sugestões marcadas "usaria como está".

3. **Modo sugestão (copilot)**
   - IA sugere, operador edita/aprova e envia. Mínimo 100 atendimentos.
   - Métrica: redução de TMR (tempo médio de resposta) ≥ 40%.

4. **Modo autônomo restrito**
   - IA responde sozinha apenas para intenções da whitelist (FAQ, materiais, coleta).
   - Tudo fora vira handoff. Janela: 2 semanas. Revisão diária.
   - Só então liberar autônomo amplo (com itens 9/10 vigentes).

Critérios de rollback: taxa de handoff > 60%, taxa de erro > 5%, qualquer incidente em campo sensível → volta ao estágio anterior automaticamente.

---

## 17. Pré-requisitos antes de codar

- [ ] Secrets a adicionar: `OPENAI_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_TOKEN`, `N8N_WEBHOOK_SECRET`.
- [ ] Confirmar com Lígia/Aline a whitelist de intenções autônomas.
- [ ] Definir número WhatsApp de staging.
- [ ] Definir `confianca_minima` inicial (sugestão: 0.75).
- [ ] Definir budget mensal e teto autônomo financeiro.

---

## 18. O que **não** muda na Fase 3

- Schema das 5 tabelas IA + `mensagens_canal` + `contexto-360`.
- RLS, cargos, permissões.
- Endpoint `/v1/contexto` (já versionado).
- Telas administrativas — apenas ganham coluna "autor=ia" mais povoada.

---

## 19. Ordem sugerida de implementação (quando aprovado)

1. Secrets + RPCs `ia_*` (atualizar lead/reserva/tarefa/handoff/memoria).
2. View `vw_ia_auditoria_diaria` + lock de UPDATE/DELETE em `ia_interacoes`.
3. Workflow N8N "Webhook In" → grava `mensagens_canal`.
4. Workflow N8N "Decisão" → contexto-360 + KB + OpenAI + parser JSON.
5. Modo sombra ligado. Coleta de baseline.
6. Modo sugestão.
7. Modo autônomo restrito.
8. Métricas em "Bárbara > Operação IA".

---

**Aguardando aprovação deste desenho para abrir o primeiro bloco de implementação (RPCs + auditoria).**
