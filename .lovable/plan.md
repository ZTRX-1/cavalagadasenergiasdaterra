# Fase 3 — Operação conectada de ponta a ponta

As Fases 1 e 2 já criaram a espinha dorsal (etapas reduzidas, conversão Lead→Reserva, participantes agrupados por expedição+data, trigger que confirma participantes quando a reserva é quitada, upload livre de docs por participante). Esta fase resolve o que ainda está **quebrado ou desconectado** na operação real.

## 1. Leads — corrigir o ponto de entrada

**Problema:** leads novos estão caindo direto em "Pronto para Reserva".

- Forçar etapa inicial `novo` em todo insert (formulário interno + endpoint público `pre-reserva`). Adiciono `DEFAULT 'novo'` + trigger `BEFORE INSERT` que normaliza qualquer valor recebido pra `novo`, exceto quando o operador cria manualmente já em outra etapa.
- Garantir que o webhook/IA quando entrar no ar só consiga **promover** etapa, nunca pular pra `pronto_reserva` direto.

## 2. Kanban arrastável (drag and drop real)

- Instalar `@dnd-kit/core` + `@dnd-kit/sortable`.
- Refatorar `admin._authenticated.leads.tsx` (modo Kanban) com `DndContext`, colunas como `droppable`, cards como `draggable`.
- `onDragEnd` chama a mutation `updateLead({ etapa_atendimento })` que já existe → trigger `lead_etapa_changed` registra na timeline automaticamente.
- Otimismo: atualizar UI antes da confirmação, rollback no erro.
- Mantém a vista Lista intacta como fallback.

## 3. Ficha do Lead — abrir e editar

A rota `leads.$id.tsx` existe mas o usuário relata "não abro o lead". Vou:

- Garantir que cada card do Kanban e linha da Lista tenha `<Link to="/admin/leads/$id" params={{ id }}>` (não só botão de ação).
- Revisar a ficha: blocos **Dados** (nome, telefone, email, CPF, origem, expedição de interesse, valor estimado) todos editáveis inline; **Observações**; **Timeline** (puxando de `lead_conversas` + eventos de webhook); **Ações** (avançar etapa, converter em reserva, marcar como perdido).
- Botão "Converter em reserva" já existe — confirmar que aparece a partir de `qualificado`.

## 4. Ficha de Reserva — o botão "Abrir"

- Reproduzir o bug do "Abrir não funciona", investigar (provavelmente Link sem `params` tipados ou erro de render). Corrigir.
- Conferir que `admin._authenticated.reservas.$id.tsx` renderiza **todos os blocos**: Resumo · Pagamentos · Participantes (já feito Fase 2) · Documentos · Timeline · Observações.
- Adicionar select de **status operacional** editável (confirmar, aguardando, parcial, pago, cancelado, em risco) — hoje só mostra badge.

## 5. Financeiro reativo no Dashboard

- Dashboard já lê valores reais (Fase 1). Confirmar que **toda** mudança em `pagamentos` invalida cache do dashboard (`queryClient.invalidateQueries(['admin-dashboard'])` no componente de pagamento).
- Adicionar card "Saldo a receber" detalhado por expedição próxima.

## 6. Documentos vinculados (limpar repositório solto)

- Manter `documentos_central` como está para docs institucionais.
- Na ficha do **Participante** (criar `participantes.$id.tsx`): mostrar dados completos + documentos enviados (já temos `participante-docs` bucket).
- Tornar a página `/admin/documentos` apenas visão consolidada (filtros por escopo: institucional · expedição · participante), não mais ponto de upload solto.

## 7. Configurações — remover duplicidade

- Hoje: rotas `configuracoes`, `usuarios`, `cargos`, `perfil`, `integracoes` separadas.
- Reorganizar a sidebar em **Configurações** como hub com subitens: Empresa · Usuários · Cargos & Permissões · Integrações · Sistema. As rotas existentes ficam, só passam a viver sob o mesmo grupo visual.
- Não mexo no schema, só na navegação.

## 8. Perfil — avatar e espaçamentos

- Corrigir avatar: forçar `aspect-square object-cover rounded-full` no `<img>`, container com `overflow-hidden`.
- Revisar paddings e alinhamento dos blocos.

## 9. Padronização visual (passe geral)

- Auditoria rápida em todas as rotas `admin._authenticated.*`:
  - Container padrão `mx-auto max-w-[1400px] px-6 py-8`.
  - `AdminPageHeader` em todas as páginas.
  - Cards usando `admin-card` token.
- Sem mudança de cor/tema, só consistência de espaçamento.

---

## Fora desta fase

- IA movendo o funil sozinha (Fase 4 — depende do gateway de IA + regras já existentes em `ia_configuracoes`).
- Contas a pagar/receber automáticas (Fase 4 financeiro avançado).

---

## Arquivos afetados

**Novos:**
- `src/routes/admin._authenticated.participantes.$id.tsx` (ficha individual).
- `src/components/admin/kanban-leads.tsx` (extraído com dnd-kit).
- `src/components/admin/reserva-status-select.tsx`.

**Editados:**
- `src/routes/admin._authenticated.leads.tsx` (Kanban dnd-kit, links pra ficha).
- `src/routes/admin._authenticated.leads.$id.tsx` (edição inline + timeline).
- `src/routes/admin._authenticated.reservas.tsx` e `reservas.$id.tsx` (corrigir Abrir + status editável).
- `src/routes/admin._authenticated.participantes.tsx` (link pra ficha).
- `src/routes/admin._authenticated.documentos.tsx` (vira visão consolidada).
- `src/routes/admin._authenticated.perfil.tsx` (avatar).
- `src/components/admin/admin-sidebar.tsx` (agrupar Configurações).
- `src/components/admin/reserva-pagamentos.tsx` (invalidar dashboard).

**Banco (migrations):**
1. `leads.etapa_atendimento` default `'novo'` + trigger `BEFORE INSERT` que força etapa inicial.
2. `supabase/functions/pre-reserva` (se já cria lead): garantir etapa `novo`.

**Dependências novas:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

**Risco:** médio — dnd-kit é mudança visual sensível no Kanban, e a correção do "Abrir" depende de reproduzir o bug. Faço Kanban + ficha do Lead + bug do Abrir primeiro (núcleo operacional), depois o resto.

Topa essa Fase 3? Posso começar pelos itens 1–4 (entrada de leads + Kanban arrastável + fichas abrindo), que são o que mais te trava hoje.
