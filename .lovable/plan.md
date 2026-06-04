# Fase 1 — Núcleo conectado: Lead → Reserva → Participante

Foco: o caminho mais curto pra você operar sem retrabalho. Financeiro avançado, docs por participante e IA ficam pra Fases 2 e 3.

## 1. Limpeza do banco (leads de teste)

- Apago todos os leads existentes (você confirmou que é tudo teste).
- Apago também: reservas, participantes, pagamentos, documentos vinculados, histórico e conversas órfãs. Expedições, datas, usuários e configurações ficam intactos.
- Roda uma vez via migration de dados, com confirmação antes de executar.

## 2. Etapas de Lead simplificadas (8 → 6)

Novas etapas: **Novo · Atendimento · Qualificado · Pronto pra Reserva · Convertido · Perdido**.

- Atualizo `LEAD_ETAPAS` em `src/lib/admin/api.ts`.
- Kanban e filtros em `admin._authenticated.leads.tsx` passam a ler as 6.
- Ficha do lead (`leads.$id.tsx`) ganha botão único de avançar etapa, com descrição clara do que cada uma significa (linguagem simples, sem jargão).
- Como o banco vai começar limpo, não precisa migração de dados antigos.

## 3. Automação Lead → Reserva (com confirmação)

Quando o operador move um lead para **Pronto pra Reserva**:

- Abre um modal "Converter em reserva?" com:
  - Expedição (pré-preenchida se o lead tem `expedicao_interesse`)
  - Data (select das datas disponíveis daquela expedição)
  - Quantidade de participantes (pré-preenchida)
  - Valor unitário (puxado da data selecionada)
- Ao confirmar: cria a **reserva** vinculada ao lead, cria **1 registro de participante** pra cada vaga (com nome do responsável no primeiro, demais em branco pra preencher depois) e gera entrada na **timeline**.
- Lead vai automaticamente pra etapa **Convertido**, com link clicável pra reserva criada.
- Tudo numa única transação — se falhar, nada é gravado.

## 4. Ficha de Reserva consolidada

A ficha (`/admin/reservas/$id`) já existe e o botão "Abrir" já leva pra ela. Vou:

- Verificar e corrigir qualquer bug que esteja impedindo a abertura (você relatou "não abre nada" — testo e arrumo).
- Reorganizar em 4 blocos visuais claros, na mesma tela, sem abas escondidas:
  1. **Resumo** — cliente, expedição, data, valor total, valor recebido, saldo restante, situação.
  2. **Participantes** — lista editável (nome, CPF, idade, peso, experiência), botão pra adicionar/remover.
  3. **Timeline** — histórico cronológico automático (lead criado, qualificado, reserva criada, contrato enviado, pagamento recebido, etc.).
  4. **Pagamentos e Documentos** — o que já existe hoje, só reorganizado.
- Linguagem em português direto, sem termos técnicos.

## 5. Timeline automática

Já existe `reserva_historico` no banco com triggers. Vou:

- Estender o trigger pra registrar também: criação do lead, mudanças de etapa do lead, conversão em reserva.
- Renderizar a timeline na ficha da reserva (componente novo `reserva-timeline.tsx`) puxando de `reserva_historico` + `lead_conversas` do lead vinculado.

## 6. Participantes — vista agrupada por Expedição+Data

Refaço `/admin/participantes` pra mostrar:

```text
SERRA DA CANASTRA — 10 a 13/Out
├─ Vagas: 12 · Confirmados: 8 · Pendentes: 2 · Disponíveis: 2
├─ Receita prevista: R$ 58.800 · Recebida: R$ 42.000 · A receber: R$ 16.800
└─ [lista de participantes com link pra reserva de cada um]
```

- Agrupamento por `expedicao_id + data_id`.
- Cada linha de participante mostra status de pagamento (puxado da reserva) e link "Ver reserva".
- Filtros: por expedição, por data, por status.

## 7. Dashboard com KPIs reais

Atualizo `/admin` (index) com cards conectados:

- Leads recebidos (mês) · Leads qualificados · Reservas criadas · Reservas confirmadas
- Receita prevista · Receita recebida · Receita pendente
- Participantes confirmados · Próximas expedições (3 mais próximas com contagem de vagas)

Tudo lendo de queries existentes — sem inventar tabela nova.

## Fora desta fase (próximas)

- **Fase 2**: financeiro reativo (pagamento → atualiza tudo automático), documentos vinculados ao participante (Maria → contrato, RG, comprovante).
- **Fase 3**: dashboard analítico avançado, IA movendo o funil sozinha.

---

## Detalhes técnicos

**Arquivos editados:**
- `src/lib/admin/api.ts` — `LEAD_ETAPAS` reduzido pra 6, função nova `converterLeadEmReserva(leadId, payload)`.
- `src/routes/admin._authenticated.leads.tsx` — Kanban com 6 colunas, modal de conversão.
- `src/routes/admin._authenticated.leads.$id.tsx` — botão "Avançar etapa" e CTA "Converter em reserva".
- `src/routes/admin._authenticated.reservas.$id.tsx` — reorganização em 4 blocos, integração com timeline.
- `src/routes/admin._authenticated.participantes.tsx` — refeito com vista agrupada.
- `src/routes/admin._authenticated.index.tsx` — KPIs novos.
- `src/components/admin/reserva-timeline.tsx` (novo).
- `src/components/admin/converter-lead-modal.tsx` (novo).

**Banco (migrations):**
1. Limpeza de dados de teste (leads, reservas, participantes, pagamentos, docs, históricos).
2. Trigger `lead_etapa_changed` estendido pra registrar conversão Lead→Reserva em `reserva_historico` quando aplicável.
3. (sem mudança de schema — só dados e função trigger)

**Sem mudanças em:** expedições, datas, usuários, cargos, config, IA, integrações, área pública do site.

**Risco:** baixo. Mudanças são aditivas exceto pela limpeza de dados (que você confirmou) e pela redução de etapas (banco começa limpo). Botão "Abrir" da reserva: investigo o motivo de não funcionar antes de refatorar — pode ser só um bug pontual.

Topa essa Fase 1? Se sim, posso começar pela limpeza + etapas novas + modal de conversão (que é o coração da mudança).