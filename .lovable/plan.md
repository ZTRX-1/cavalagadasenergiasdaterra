## Diagnóstico

**Home (imagem 1):**
- O hero hoje usa `h-[88svh] max-h-[920px]` → em monitores grandes (1920×1137 do usuário) ele encurta visivelmente e a seção bege aparece atrás.
- A cabeça da Lígia está sendo coberta pelo header escuro (não é crop da imagem — é o header sobrepondo). Precisa empurrar o foco da foto para baixo do header.
- Texto com `mt-6 / mt-7 / mt-10` está com respiros grandes demais para o tamanho do bloco.

**Quem Somos (imagem 2):**
- O hero usa a mesma foto da Lígia da Home (retrato vertical) numa faixa larga → topo da cabeça sai do quadro e a imagem domina meia tela sem necessidade.
- Solução: trocar por uma paisagem cinematográfica (sem rosto humano cortável). A `mantiqueira/05.jpg` é perfeita — cavaleira + cavalo em silhueta B&W contra vale com luz suave, muito espaço negativo, editorial puro.

---

## Plano de correção

### 1. Home hero — `src/routes/index.tsx`

- Trocar `h-[88svh] min-h-[560px] max-h-[920px] md:h-[92svh]` → **`h-screen min-h-[640px]`** (100% viewport real, sem teto).
- `object-position`: trocar `[object-position:47%_24%]` → **`[object-position:48%_38%]`** — abaixa o foco para que cabeça da Lígia fique claramente abaixo da faixa do header em qualquer altura de tela.
- Tightening do texto:
  - `h1`: `text-5xl md:text-7xl lg:text-[5.5rem]` → `text-5xl md:text-6xl lg:text-7xl` (menos gigante em desktop wide).
  - `mt-6` (h1) → `mt-5`; `mt-7` (p) → `mt-6`; `mt-10` (CTAs) → `mt-8`; `mt-8` (lang) → `mt-6`.
  - Subtítulo `max-w-xl` → `max-w-lg` para evitar linhas longas/feias.
- Manter overlays atuais (`bg-carvao/45` + gradientes) — funcionam bem.

### 2. Quem Somos hero — `src/routes/quem-somos.tsx`

- Remover a foto da Lígia da hero.
- Importar `mantiqueira/05.jpg` como nova imagem do hero (paisagem cinematográfica, sem rosto, sem risco de crop).
- Manter o layout atual (faixa cinematográfica de 52–58svh + bloco de título flutuando sobre `bg-carvao` logo abaixo) — só troca o asset e ajusta `object-position` para `center` (a foto é larga e não exige tuning).
- A foto da Lígia continua aparecendo na página, mas dentro do bloco editorial dela mais abaixo (onde já está, com `EditorialFrame portrait`) — que é o lugar correto para um retrato.
- Atualizar `alt` e o `og:image` do `head()` para a nova imagem.

### 3. Não mexer

- Estrutura geral do site, identidade visual, tokens, blocos abaixo do hero, rotas, i18n, bloco de fundadoras (já reescrito com textos reais), Na Mídia, footer, etc.

---

## Arquivos tocados

- `src/routes/index.tsx` — hero (altura + object-position + spacing do texto).
- `src/routes/quem-somos.tsx` — troca de imagem do hero + meta `og:image`.

Nenhum arquivo novo, nenhum componente novo, nenhuma quebra estrutural.
