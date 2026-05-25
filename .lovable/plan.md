
# Refatoração Operacional do Admin — Etapa 2.5 Final

Objetivo: deixar de tratar o admin como mockup e transformá-lo em sistema operacional real, conectado ao banco e ao site público, com CRUD estável e relacionamentos corretos.

Dividido em 5 frentes sequenciais. Vou executar tudo numa rodada (você já validou frentes anteriores e isso destrava o restante do projeto), mas cada frente é independente — se algo falhar, corrijo antes de seguir.

---

## Frente 1 — Sincronização real Site ↔ Banco ↔ Admin

**Problema:** admin mostra "Nenhuma expedição" porque o site público lê de `src/lib/expedicoes-static.ts` (arquivo TS), enquanto o admin lê da tabela `expedicoes`. Os dois universos nunca se cruzaram.

**Solução (migração + seed):**
- Migration que faz seed das expedições estáticas para a tabela `expedicoes` (com `ON CONFLICT (slug) DO NOTHING` — não sobrescreve nada que o admin já tenha criado).
- Para cada expedição seedada: criar registros em `expedicao_assets` (capa + galeria) e em `datas` (datas existentes no estático).
- Trocar `src/lib/expedicoes.functions.ts` (já existe como server fn) para buscar do banco em vez do arquivo estático. O site público passa a ler do banco também.
- O arquivo `expedicoes-static.ts` vira fallback/seed-source, não fonte de verdade.

**Resultado:** o que o admin cria aparece no site; o que existe no site aparece no admin.

---

## Frente 2 — CRUD de Expedições estável

**Problema:** "Nova Expedição" → toast de sucesso → tela branca → reload quebrado.

**Causas prováveis:**
1. Navegação para `/admin/expedicoes/:id` quando o id ainda não está no cache do React Query.
2. Falta de `invalidateQueries` da lista após o insert.
3. Slug retry funciona, mas a mutation não retorna a row final.

**Correções em `src/lib/admin/api.ts` + rota:**
- `createExpedicao` retorna a row inserida (`.select().single()`) garantida.
- Após sucesso: `queryClient.invalidateQueries(['admin','expedicoes'])` + `navigate({ to: '/admin/expedicoes/$id', params: { id: nova.id } })`.
- Rota de detalhe: `notFoundComponent` + `errorComponent` + loader que aguarda dados antes de renderizar.
- Garantir defaults seguros em todas as colunas NOT NULL na criação (descricao_curta/longa, duracao, nivel, preco, marca, pais, slug).

---

## Frente 3 — Mídia real ligada à expedição

A página de detalhe da expedição (`admin._authenticated.expedicoes.$id.tsx`) ganha aba **Mídia** funcional:
- Lista `expedicao_assets` da expedição (já existe API).
- Upload real para bucket `expedicao-midia` (público) com path `{expedicao_id}/{uuid}.{ext}`.
- Setar capa, mover ↑/↓, excluir, adicionar URL externa de vídeo.
- A página `/admin/midia` (global) vira um índice navegável agrupado por expedição, em vez de gerenciar mídia "solta".

---

## Frente 4 — Documentos com separação institucional vs participante

**Estrutura:**
- Tabela `documentos` já tem `expedicao_id`, `reserva_id`, `participante_id`, `tipo`, `categoria`.
- Adicionar coluna `escopo` (`institucional` | `expedicao` | `participante`) via migration para classificação clara.
- Adicionar RLS específico: documento de participante só é visível para internos com vínculo (a RLS atual já restringe a `is_internal_user` — manter, mas documentar que filtro adicional acontece na UI).
- UI `/admin/documentos`: 2 abas — **Institucionais/Expedição** e **Participantes**, com filtros por expedição/reserva/participante.
- Upload para buckets já existentes (`expedicao-docs`, `participante-docs`), signed URLs.

---

## Frente 5 — Configurações + Usuários internos reais

**Empresa:** já persiste via tabela `configuracoes` (singleton). Adicionar campos `endereco`, `email` na migration.

**Usuários internos (novo):**
- Já existe `profiles` + `user_roles` com enum `app_role`. Faltam: criar/editar/desativar/reset.
- Adicionar coluna `ativo boolean` em `profiles`.
- Server fns protegidas (`requireSupabaseAuth` + checagem `has_role(admin)`):
  - `criarUsuarioInterno({ email, nome, cargo, role, senha_temporaria })` — usa `supabaseAdmin.auth.admin.createUser`.
  - `atualizarUsuarioInterno({ user_id, nome, cargo, role, ativo })`.
  - `resetarSenhaInterna({ user_id })` — gera link de recovery.
  - `removerUsuarioInterno({ user_id })` — `supabaseAdmin.auth.admin.deleteUser`.
- Roles preparados: `admin`, `financeiro`, `operador`, `midia`, `atendimento` (adicionar valores ao enum `app_role`).
- UI nova na aba **Usuários internos** das Configurações: tabela + dialog de criação/edição.

---

## Detalhes Técnicos

**Migrations (2):**
1. Seed expedições + assets + datas a partir do estático; adiciona `escopo` em `documentos`; adiciona `endereco`/`email` em `configuracoes`; adiciona `ativo` em `profiles`; estende enum `app_role` com novos papéis.
2. Trigger `update_updated_at_column` em `expedicoes`, `datas`, `reservas`, `leads`, `participantes`, `configuracoes`, `profiles` (auditoria consistente).

**Arquivos novos:**
- `src/lib/admin/users.functions.ts` (server fns para gestão de usuários, usa `supabaseAdmin`).
- `src/lib/admin/seed-helper.server.ts` (helpers de seed reutilizáveis).
- `src/components/admin/admin-tab-midia.tsx`, `admin-tab-documentos.tsx` (componentes de aba reutilizáveis na expedição).

**Arquivos editados (~12):**
- `src/lib/admin/api.ts` (createExpedicao com select+invalidate, mídia helpers, documentos por escopo).
- `src/lib/expedicoes.functions.ts` (ler do banco em vez do estático).
- `src/routes/admin._authenticated.expedicoes.tsx` (mutation com invalidate + navigate).
- `src/routes/admin._authenticated.expedicoes.$id.tsx` (abas: Dados / Datas / Mídia / Documentos).
- `src/routes/admin._authenticated.midia.tsx` (índice por expedição).
- `src/routes/admin._authenticated.documentos.tsx` (2 abas + filtros).
- `src/routes/admin._authenticated.configuracoes.tsx` (form expandido + CRUD usuários).
- `src/integrations/supabase/types.ts` (regenerado automaticamente após migration).

**Não muda:**
- Site público continua funcionando (passa a ler do banco, mas com mesmas expedições).
- Hero, rotas públicas, design da landing — intactos.
- Não toca em auth, RLS existente (apenas adiciona policies novas para configuracoes).

---

## Fora do escopo (continua proibido nesta etapa)
- IA, WhatsApp, e-mail automático, Mercado Pago, automações, remarketing.

Aprovar para eu executar tudo de uma vez?
