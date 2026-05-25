# Refatoração Final — Estabilização Operacional do CRM

Esta é uma etapa grande. Vou estabilizar tudo antes de qualquer feature nova (IA, WhatsApp, automações). Abaixo o que será feito, em ordem.

---

## 1. Sincronização das 7 expedições do site → admin

**Problema:** o site mostra 7 expedições (dados estáticos em `src/lib/expedicoes-static.ts`), mas o admin mostra "nenhuma expedição" porque a tabela `expedicoes` está vazia.

**Ação:**
- Seed (migration de dados) inserindo as 7 expedições reais no banco com slug, nome, descrição, preço, marca, região, capa_url e galeria.
- Trocar a fonte do site público (`expedicoes.tsx` e `expedicoes.$slug.tsx`) para ler do banco via `createServerFn` — assim admin e site sempre batem.
- Manter o arquivo estático apenas como fallback / referência de imagens via `expedicao-images.ts`.

---

## 2. Criação de expedição (corrigir "tela branca")

**Problema:** clica em "Nova expedição", toast aparece, mas navegação quebra / lista não atualiza / slug conflita.

**Ação:**
- Garantir uso da função `slugify_unique_expedicao()` no insert (evita `expedicoes_slug_key` conflict).
- Inserir defaults válidos para todas as colunas NOT NULL (`descricao_curta`, `descricao_longa`, `duracao`, `nivel`, `preco`).
- Validar que a rota `/admin/expedicoes/$id` existe e carrega — corrigir loader/hydration.
- Após criar: pré-popular cache, navegar, depois invalidar lista (já feito parcialmente, vou auditar).

---

## 3. CRUD real em Expedições

Auditar a tela de detalhe `/admin/expedicoes/$id` e garantir que TODOS os botões salvam de verdade:
- Editar campos básicos (nome, slug, descrições, preço, duração, nível, marca, região, vagas, parcelamento).
- Definir capa (upload para bucket `expedicao-midia` → grava `capa_url`).
- Gerenciar galeria (upload múltiplo, ordenar, remover, marcar capa) via tabela `expedicao_assets`.
- Datas e vagas (CRUD na tabela `datas`).
- Publicar / Pausar / Arquivar / Duplicar / Excluir.

---

## 4. Mídia funcional

**Hoje:** tela placeholder.

**Vou entregar:**
- Upload real para bucket `expedicao-midia` (público).
- Lista visual com preview (img/vídeo).
- Seleção da capa principal por expedição.
- Reordenação (campo `ordem`).
- Suporte a URL externa para vídeos (YouTube/Vimeo).
- Filtro obrigatório por expedição — toda mídia pertence a uma expedição.

---

## 5. Documentos — três escopos separados

A tabela já tem coluna `escopo`. Vou implementar as 3 abas e enforce de isolamento:

- **Institucional/Jurídico** (`escopo='institucional'`): contratos, termos, políticas.
- **Operacional/Expedição** (`escopo='expedicao'` + `expedicao_id`): roteiros, checklists, PDFs da viagem.
- **Participante** (`escopo='participante'` + `participante_id`): RG, exames, comprovantes. **Visível apenas no perfil daquele participante** — nunca exposto em lista geral aberta a outros.

---

## 6. Participantes e grupos (reservas)

- Reserva = grupo. Tela de reserva mostra: responsável, participantes vinculados, documentos do grupo, financeiro, status.
- Cada participante tem ficha individual com: dados pessoais, restrições médicas/alimentares, documentos próprios (escopo participante), histórico financeiro.

---

## 7. Configurações — módulo real

- **Empresa:** nome, CNPJ, endereço, WhatsApp, Instagram, e-mail, logo, cor de destaque (salvando em `configuracoes`).
- **Equipe interna:** criar/editar/remover/ativar/desativar usuário, redefinir senha, definir cargo e role (admin/financeiro/operacional/midia/atendimento). Edge function `admin-users` já existe — vou expandir e amarrar na UI.

---

## 8. Responsividade total

Auditar todas as telas admin no breakpoint <768px:
- Sidebar → drawer (já existe `AdminSidebarDrawer`, validar).
- Tabelas → cards empilhados.
- Toolbars/filtros → stack vertical com scroll horizontal de chips.
- Formulários → coluna única.
- Botões com alvo de toque ≥40px.

---

## 9. Rastreabilidade e relacionamentos

Garantir que os FKs lógicos funcionam end-to-end:
`lead → reserva → participantes → documentos/financeiro`, todos vinculados à `expedicao_id`.
Adicionar `updated_at` triggers onde faltar e logar ações críticas em `activity_logs`.

---

## 10. Remover placeholders

Varredura final em todas as rotas `admin._authenticated.*` removendo textos "em construção", dados fake e exemplos genéricos.

---

## Ordem de execução

1. Migration: seed das 7 expedições + ajustes de defaults.
2. Trocar site público para ler do banco.
3. Corrigir create + detalhe de expedição.
4. Mídia funcional.
5. Documentos com 3 escopos.
6. Reservas/participantes (ficha individual).
7. Configurações empresa + equipe.
8. Auditoria responsiva mobile.
9. Limpeza de placeholders.

---

## Detalhes técnicos

- Stack: TanStack Start + Lovable Cloud (Supabase).
- Tudo server-side via `createServerFn` ou queries diretas autenticadas.
- Storage: buckets `expedicao-midia` (público), `expedicao-docs`, `participante-docs` (privados) — já existem.
- RLS: políticas `is_internal_user()` já protegem o admin; público lê só `status='publicado' AND ativo=true`.
- Sem novas dependências.

Posso começar pela migration de seed das 7 expedições?
