
# Plano: Seção "Como Chegar" nas Expedições

Implementação totalmente dinâmica, editável pelo painel e pronta para uso futuro por IA.

## 1. Banco de dados (migration)

Adicionar 5 colunas em `public.expedicoes` (todas `text`, nullable):

- `como_chegar_titulo` — título customizado da seção (default exibido no front: "Como Chegar")
- `como_chegar_conteudo` — texto principal (longo)
- `como_chegar_aeroporto` — aeroporto mais próximo
- `como_chegar_referencia` — cidade de referência
- `como_chegar_observacoes` — observações adicionais (longo)

Não altera RLS nem grants (já cobertos pelas policies existentes da tabela).

Após migration, `src/integrations/supabase/types.ts` é regenerado automaticamente.

## 2. Conteúdo inicial (seed)

Via `supabase--insert` com `UPDATE` na tabela `expedicoes`, preenchendo os 7 destinos pelos slugs:

- `serra-da-canastra` → Ribeirão Preto / São Roque de Minas
- `serra-da-mantiqueira` → Guarulhos ou Congonhas / Campos do Jordão
- `berco-do-mangalarga-marchador` (ou slug equivalente) → Confins / Cruzília
- `jericoacoara` → JJD / Vila de Jericoacoara
- `vale-do-colca-peru` → Arequipa / Arequipa
- `patagonia-argentina` → San Martín de los Andes / San Martín de los Andes
- `caminho-de-santiago-a-cavalo` → Santiago de Compostela / Santiago de Compostela

Os slugs exatos serão confirmados via `read_query` antes do UPDATE.

## 3. Camada de leitura (`src/lib/expedicoes.functions.ts`)

Estender o tipo `Expedicao` e `normalizeExpedicao` para incluir os 5 novos campos. Sem mudança nas queries (já usam `select("*")`).

Atualizar também `src/lib/expedicoes-static.ts` adicionando os campos opcionais ao tipo (fallback ficará vazio).

## 4. Frontend público (`src/routes/expedicoes.$slug.tsx`)

Nova seção "Como Chegar" no fluxo da página, posicionada após o roteiro / antes de requisitos (a definir conforme layout atual). Renderiza somente se houver pelo menos um dos campos preenchidos.

Estrutura editorial alinhada ao design existente (admin-card / tipografia display + serif do projeto):

- Eyebrow + título (`como_chegar_titulo` ou "Como Chegar" como fallback)
- Dois "info-tiles" lado a lado (md+): ícone Plane + "Aeroporto mais próximo"; ícone MapPin + "Cidade de referência"
- Texto principal (`como_chegar_conteudo`) em parágrafo editorial
- Bloco "Observações" destacado (se preenchido), com ícone Info

Ícones via `lucide-react` (já em uso no projeto). Sem cores hardcoded — usar tokens do design system.

## 5. Painel administrativo (`src/routes/admin._authenticated.expedicoes.$id.tsx`)

Adicionar nova aba **"Como Chegar"** ao `Tabs` existente da edição de expedição.

Conteúdo da aba (usando `AdminSection` + `AdminField` já existentes):

- **Título da seção** (Input) — hint: "Personalize o título exibido no site. Deixe em branco para usar 'Como Chegar'."
- **Aeroporto mais próximo** (Input) — hint: "Informe o aeroporto normalmente utilizado pelos participantes."
- **Cidade de referência** (Input) — hint: "Informe a principal cidade utilizada como ponto de chegada."
- **Texto principal** (Textarea) — hint: "Descreva como os participantes costumam chegar ao destino."
- **Observações adicionais** (Textarea) — hint: "Detalhes extras: transfer, distâncias, dicas logísticas."

Os 5 campos entram no payload de save junto com os demais (mesma função update já usada).

## 6. Validação final

- Migration aplicada, types regenerados.
- Página pública de cada expedição renderiza a nova seção quando preenchida.
- Aba do admin salva e recarrega corretamente os 5 campos.
- Sem overflow / sem texto hardcoded no front.

## Detalhes técnicos

- Nenhum novo componente compartilhado é necessário; reusamos `AdminSection`, `AdminField`, `Input`, `Textarea`, tokens `--admin-*` e classes `admin-card`.
- Fallback estático (`expedicoes-static.ts`) recebe os tipos opcionais mas não conteúdo — a seção simplesmente não renderiza se o DB estiver indisponível.
- Estrutura dos campos é plana (5 colunas text) — fácil de consumir por agente IA futuro via simples `select` na tabela `expedicoes`.
