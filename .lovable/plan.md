
# Fase 2 — Preparação Operacional para a IA Bárbara

Objetivo: deixar todo o substrato (dados, eventos, regras, telas internas) pronto para que, na Fase 3, a Bárbara seja apenas "plugada" — sem que essa fase já dependa de OpenAI, WhatsApp ou N8N.

Nenhuma chamada a LLM, nenhum provedor de mensageria e nenhum webhook externo serão habilitados aqui. Tudo é estrutura interna, com simulação manual via painel admin.

---

## 1. Princípios da Fase 2

- Estrutura primeiro, inteligência depois. A Bárbara, quando ligada, deve apenas ler/gravar nas tabelas — não criar nada novo.
- Cada ação automática hoje deve ter um equivalente manual em tela, para que o operador "atue como Bárbara" durante o piloto.
- Toda decisão da IA deve ser auditável: o que ela leu, o que respondeu, com qual confiança, e quando passou para humano.
- Multi-moeda, vagas e jornada permanecem intocados. A Fase 2 não muda regra de negócio existente.

---

## 2. Camadas a entregar

```text
+--------------------------------------------------------------+
|  Painel admin (telas de operação assistida)                  |
|  - Caixa de entrada unificada                                |
|  - Fila de handoff humano                                    |
|  - Base de conhecimento                                      |
|  - Tarefas operacionais                                      |
|  - Configurações da Bárbara (perfil, tom, limites)           |
+----------------------------+---------------------------------+
                             |
+----------------------------v---------------------------------+
|  Camada de domínio Bárbara (tabelas já existentes, vazias)   |
|  ia_interacoes  ia_handoff_queue  ia_knowledge_base          |
|  tarefas        mensagens_canal   ia_configuracoes           |
+----------------------------+---------------------------------+
                             |
+----------------------------v---------------------------------+
|  Núcleo CRM já estabilizado na Fase 1                        |
|  leads / reservas / participantes / pagamentos / datas       |
+--------------------------------------------------------------+
```

---

## 3. Entregas por bloco

### Bloco A — Identidade e configuração da Bárbara
- Tela "Configurações > Bárbara" lendo/gravando `ia_configuracoes`: nome exibido, tom de voz, idiomas, horário operante, modo (sombra / sugestão / autônomo), limite de confiança para resposta automática, gatilhos de handoff.
- Sem nenhuma chamada a modelo — apenas persistência das regras.

### Bloco B — Caixa de entrada unificada (`mensagens_canal`)
- Tela "Atendimento > Caixa de Entrada" listando mensagens por lead/reserva, agrupadas por canal (whatsapp, email, site_form, instagram_dm — campos já previstos, sem integração real).
- Permitir registrar mensagem manualmente (entrada e saída) para simular a operação.
- Vinculação automática a `lead_id` / `reserva_id` quando o remetente já existir.

### Bloco C — Registro de interações da IA (`ia_interacoes`)
- Todo registro manual feito por operador gera linha em `ia_interacoes` marcada como `autor='humano'`.
- Quando a Bárbara entrar (Fase 3), as mesmas colunas recebem `autor='ia'`, `modelo`, `confianca`, `tokens`, `latencia_ms`, `contexto_usado` (jsonb).
- Tela de timeline do lead/reserva mostra mensagens humanas e simuladas de IA lado a lado.

### Bloco D — Fila de handoff humano (`ia_handoff_queue`)
- Tela "Atendimento > Handoff" com itens pendentes: motivo, prioridade, lead/reserva associada, SLA.
- Operador pode "assumir", "devolver para IA" (quando existir) e "concluir".
- Triggers que já criamos (lead_transferido_humano, pagamento_recebido, contrato_assinado) passam a inserir itens nessa fila automaticamente — hoje só emitem webhook.

### Bloco E — Tarefas operacionais (`tarefas`)
- CRUD de tarefas vinculadas a lead/reserva/expedição com prazo, responsável, prioridade, origem (`manual` / `automacao` / `ia`).
- Painel "Minhas tarefas" no topbar com contador.
- Regras automáticas de criação (sem IA): por exemplo, ao mudar reserva para `reserva_confirmada`, criar tarefa "Enviar contrato".

### Bloco F — Base de conhecimento (`ia_knowledge_base`)
- Tela "Bárbara > Conhecimento" para Lígia/Aline cadastrarem:
  - Perguntas frequentes
  - Políticas (cancelamento, pagamento, bagagem)
  - Descrições por expedição (resumo curto + diferencial + público)
  - Roteiros padrão de resposta
- Cada item com: título, categoria, idioma, expedição (opcional), conteúdo markdown, `ativo`, `prioridade`, `tags`.
- Versionamento simples (campo `versao`, atualizado em cada save).
- Sem embeddings nesta fase — apenas texto estruturado. A Fase 3 indexa.

### Bloco G — Contexto unificado do lead/reserva
- View `vw_contexto_lead` e `vw_contexto_reserva` consolidando, em jsonb único, tudo que a Bárbara precisará ler:
  - Dados do lead / reserva / participantes / pagamentos / moeda
  - Últimas N interações
  - Tarefas abertas
  - Itens da KB aplicáveis à expedição
- Endpoint interno (edge function `contexto-bárbara` com `verify_jwt=true`) que devolve esse contexto. Hoje serve a tela "Visão 360"; amanhã serve a IA.

### Bloco H — Permissões e cargos
- Novo cargo `atendente_ia_supervisor` com acesso a Caixa de Entrada, Handoff, KB e Config da Bárbara.
- Política RLS revisada nas 5 tabelas IA para permitir leitura/escrita por `operador` e `atendente_ia_supervisor`, e leitura total por `admin/ceo/superadmin/desenvolvedor`.

### Bloco I — Métricas operacionais (preparação)
- Tela "Bárbara > Métricas" mostrando, com base nos registros manuais:
  - Volume de mensagens por canal e por dia
  - Tempo médio de resposta humana
  - Handoffs abertos / fechados / SLA
  - Tarefas no prazo vs atrasadas
- Esses mesmos painéis servirão de baseline para comparar com a IA na Fase 3.

---

## 4. Garantias de compatibilidade futura

- Schemas das 5 tabelas IA não serão alterados na Fase 3, apenas populados.
- Toda escrita já é feita com o mesmo formato que a Bárbara usará (autor, confianca, contexto_usado).
- Webhooks atuais continuam emitindo — quando o N8N entrar, ele só precisa assinar.
- Endpoint de contexto já existe e é versionado (`/v1/contexto`), evitando refactor depois.

---

## 5. Fora do escopo desta fase

- Integração com OpenAI / Lovable AI Gateway
- Integração com WhatsApp Business API
- N8N / orquestração externa
- Embeddings, RAG, busca vetorial
- Mudanças em jornada, vagas, moeda ou financeiro

---

## 6. Critérios de aceite

- Operador consegue rodar um atendimento completo (mensagem → handoff → tarefa → resposta → conclusão) usando apenas as novas telas.
- Toda essa operação aparece na timeline do lead/reserva.
- `vw_contexto_lead` devolve, para qualquer lead com reserva, um jsonb único contendo dados + interações + tarefas + KB aplicável.
- Nenhuma chamada externa é feita; nenhum segredo novo é necessário.
- Auditoria `vw_jornada_consistencia` permanece sem regressões.

---

## 7. Ordem sugerida de execução

1. Bloco A (config) + Bloco H (permissões)
2. Bloco F (KB) — para já começarmos a popular o conhecimento real
3. Bloco B + C (caixa de entrada + ia_interacoes)
4. Bloco D + E (handoff + tarefas)
5. Bloco G (contexto unificado)
6. Bloco I (métricas)

Cada bloco será entregue com seu próprio mini-teste operacional, no mesmo formato do teste ponta a ponta da Fase 1.

Aprovando este plano, começo pelo Bloco A + H.
