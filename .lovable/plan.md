# Etapa 2.5 — Painel admin realmente funcional

Escopo grande (21 frentes). Vou dividir em **4 frentes sequenciais** com aprovação entre cada uma, para reduzir risco e permitir QA pontual.

---

## Frente A — Dados, protocolos e expedições (itens 1, 5, 6, 7, 8, 11)

**Migration única:**
- Limpar dados transacionais de teste: `DELETE FROM reservas`, `participantes`, `leads`, `lead_atividades`, `documentos`, `protocolo_counter`, `protocolo_lead_counter`. Preserva `expedicoes`, `datas`, `expedicao_assets`, `profiles`, `user_roles`.
- Trocar geração de protocolo para token alfanumérico (`CET-2026-A7K9Q2`): nova função `gerar_protocolo_seguro()` usando `gen_random_bytes` + base36, 6 chars, validando unicidade.
- Garantir `slug` único em `expedicoes` com auto-sufixo numérico via função `slugify_unique(text)`.

**Backfill expedições do site:**
- Ler `src/lib/expedicoes-static.ts` e fazer seed idempotente (`ON CONFLICT (slug) DO NOTHING`) das expedições estáticas do site público para a tabela `expedicoes`, com imagem, datas, preço, vagas, marca, roteiro, inclui, requisitos, política.
- Resultado: admin lista as ~7 expedições reais imediatamente.

**API (`src/lib/admin/api.ts`):**
- `createExpedicao`: gerar slug único via RPC ou retry com sufixo.
- `duplicateExpedicao`: copiar com novo slug `original-copia-{rand}`.
- CRUD completo testado: criar, editar, rascunho/publicar, pausar, arquivar, duplicar, excluir, capa.
- Contadores reais já implementados — só validar pós-seed.

---

## Frente B — Dashboard, financeiro e busca (itens 2, 3, 4, 12, 16, 17)

- **Date picker "Personalizado":** Popover com Calendar shadcn em modo `range`, botões Aplicar/Limpar.
- **Tooltip faturamento:** texto explicando "50% Pix + 50% cartão sobre vagas disponíveis".
- **Pré-reservas:** após Frente A todos contadores zerados; revisar filtros por `created_at`.
- **Financeiro:** reescrever página puxando `reservas` reais (protocolo novo, responsável (jsonb), expedição, datas, valores, saldo_restante, forma_pagamento, status_pagamento).
- **Busca topbar:** já tem `pl-10`, mas validar e ajustar para responsividade — esconder no `<md` e mostrar drawer/sheet.
- **Sino:** já tem tooltip; adicionar mini-popover com "Sem notificações no momento".

---

## Frente C — Leads, Participantes, Mídia, Documentos, Configurações (itens 9, 10, 13, 14, 15)

- **Leads:** formulário com todos os 16 campos listados (já tem a maioria — completar origem como select padronizado e expedição_interesse como select de expedições reais).
- **Participantes:** remover qualquer mock/seed "Empresa Josefina"; ficha individual com idade calculada a partir de `data_nascimento`; agrupamento por reserva.
- **Mídia:** página funcional — seletor de expedição, grid de `expedicao_assets`, botões: definir capa, mover ↑/↓, remover, adicionar URL externa de vídeo, upload novo.
- **Documentos:** página funcional — upload PDF para buckets `expedicao-docs`/`participante-docs`, vínculo com expedição/reserva/participante, select de tipo (contrato/termo/política/aceite/ficha médica/roteiro/outro), listagem filtrável.
- **Configurações:** nova tabela `configuracoes` (singleton jsonb) com aba Empresa (nome, CNPJ, WhatsApp, e-mails, Instagram, logo) e aba Usuários internos (listagem de `profiles` + `user_roles`, sem criação).

---

## Frente D — Responsividade total e polimento (itens 18, 19, 20)

- Sidebar vira Drawer (`Sheet`) abaixo de `md`.
- Tabelas (expedições, leads, participantes, financeiro) viram cards empilhados abaixo de `md` via componente `AdminResponsiveTable`.
- Formulários: forçar `grid-cols-1` no mobile, `md:grid-cols-2`.
- Topbar: título + ações colapsam em coluna no mobile.
- Auditoria final: remover qualquer string mock ("Empresa Josefina", "Lorem ipsum", "Exemplo"). Padronizar empty states profissionais.
- Garantir que campos estruturais (protocolo, status, datas) estejam consistentes para futura leitura por automação.

---

## Como prefere prosseguir?

1. **Tudo (A→D) numa rodada** — diff enorme (~30 arquivos + 2 migrations), mas finaliza a Etapa 2.5.
2. **Uma frente por vez** — começo por A, você valida, sigo para B, etc. (recomendado).
3. **A+B juntos, depois C+D** — meio termo.

Diga qual opção e eu executo.
