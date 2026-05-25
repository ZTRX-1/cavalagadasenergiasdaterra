# Etapa 2.5 — Painel Interno Funcional

Vou dividir o trabalho em **4 frentes** para entregar de forma estável, sem quebrar o que já está em pé. Cada frente é um bloco independente que posso entregar e validar antes de seguir.

> Importante: o escopo é grande (17 itens). Vou pedir confirmação para executar **as 4 frentes em sequência** nesta mesma rodada (sem parar para perguntar entre elas), ou então só a Frente 1 + 2 agora — você decide no final.

---

## Frente A — Correções críticas (bloqueiam uso hoje)

Itens 1, 2, 3, 15 do briefing.

1. **RLS expedições** — auditar policies de `expedicoes`, `datas`, `expedicao_assets`. Garantir que `is_internal_user(auth.uid())` cobre INSERT/UPDATE/DELETE para `authenticated`. Migration corrigindo eventuais gaps.
2. **`.single()` quebrando ações** — trocar por `.maybeSingle()` em `src/lib/admin/api.ts` (get/update/duplicate). Tratamento de erro consistente nos botões pausar/arquivar/duplicar/excluir.
3. **Capas das expedições** — corrigir resolução de capa na listagem e no editor:
   - prioridade: `capa_url` → primeiro `expedicao_assets` com `is_capa=true` → primeiro asset ordenado → `imagem_url` legado → placeholder.
   - garantir que upload em `expedicao-midia` grava `expedicao_assets` corretamente e atualiza `capa_url`.
4. **Barra superior** — corrigir input de busca (padding-left para a lupa não sobrepor texto), tooltip "Sem notificações" no sino.

## Frente B — Dashboard, contadores e financeiro

Itens 4, 5, 6, 7, 11.

5. **Filtros de período no dashboard** (Hoje / Semana / Mês / Ano / Personalizado) afetando KPIs de leads, pré-reservas, faturamento, próximas expedições.
6. **Datas com ano completo** — formatador `04 a 07 de junho de 2026` em todas as listagens admin.
7. **Faturamento estimado misto** — 50% Pix + 50% Cartão por vaga; fallback para `preco` quando não houver `preco_cartao`.
8. **Progresso das expedições** — label explícita: `8 / 14 vagas preenchidas (6 restantes)` + barra de progresso.
9. **Contadores na listagem de expedições** — Total / Publicadas / Rascunho / Pausadas / Arquivadas como chips clicáveis (filtram a tabela).
10. **Financeiro real** — corrigir agregações para usar `reservas` confirmadas/pendentes/parciais com saldo restante, forma e parcelas.

## Frente C — Leads, Participantes, Grupos, Documentos

Itens 8, 9, 10, 12.

11. **Leads — campos adicionais**: CPF, peso, data nascimento, experiência equestre, observações médicas, restrições alimentares, origem (select), expedição de interesse (FK para `expedicoes`). Migration + form.
12. **Participantes — campos completos**: CPF, peso, data nascimento + idade calculada, telefone, email, experiência, restrições médicas/alimentares, observações, expedição vinculada, grupo, status. Migration + form.
13. **Grupos / reservas em grupo** — modelar grupo como `reservas` com `participantes[]`; cada participante vira linha em `participantes` com `reserva_id`. Tela do grupo com responsável, lista de fichas individuais, valor, pagamento, documentos, observações.
14. **Documentos** — vincular corretamente a `expedicao_id`, `participante_id` ou `reserva_id` (já existe coluna parcial). Tipos: contrato, termo, política, ficha médica, jurídico. Tela com filtros por vínculo e tipo + upload em `expedicao-docs` / `participante-docs`.

## Frente D — Mídia, Configurações, Analytics placeholder

Itens 13, 14, 16.

15. **Mídia** — galeria por expedição: grid de assets, definir capa, reordenar, remover, adicionar vídeo externo via URL.
16. **Configurações** — tabela `configuracoes` (singleton jsonb) com: dados da empresa, WhatsApp oficial, e-mails de notificação, Instagram, identidade visual. Aba "Usuários internos" lista `profiles + user_roles` (criar usuário fica para Etapa 3, agora só visualização e papel).
17. **Analytics placeholder** — card "Acessos ao site — em breve" no dashboard, sem integração.

---

## Detalhes técnicos relevantes

- **Migrations**: 1 migration única consolidando todos os ALTERs (`leads`, `participantes`, `reservas` para `grupo_nome/responsavel_id`, `documentos` campos extras, `configuracoes` nova tabela). RLS `is_internal_user` para tudo.
- **API**: refactor `src/lib/admin/api.ts` — tudo via Supabase SDK (browser client) com session do usuário interno autenticado. `.maybeSingle()` em todos os fetch-by-id.
- **Cover resolver**: helper `resolveCapa(expedicao, assets)` reutilizado em listagem, editor e site público.
- **Filtros de período**: hook `useDateRange()` com presets; queries do dashboard recebem `{from, to}`.
- **Formato de data**: helper `formatarPeriodo(inicio, fim)` em `src/lib/format.ts`.

## Fora de escopo (Etapa 3)

IA, WhatsApp, e-mail automático, Mercado Pago, automações, triggers de mensagens, scraping de analytics real.

---

## Pergunta antes de executar

O escopo é grande (esperado: ~25 arquivos novos/editados + 1 migration densa). Como prefere?

1. **Executar tudo (A → D) nesta rodada** — entrego um diff grande, mas o painel fica completo.
2. **Só Frente A + B agora** (correções críticas + dashboard/financeiro). C e D ficam para a próxima mensagem.
3. **Uma frente por vez**, com sua aprovação entre cada.