
# Refinamento Final — Storytelling, Autoridade e Experiência Premium

Recebi as duas fotos (Lígia atravessando o rio + Alinne no Pantanal). Vou usá-las como peças centrais do novo storytelling. Não vou refatorar layout nem mexer na identidade visual já aprovada — apenas elevar.

---

## 1. Assets

- Copiar `user-uploads://fundo_hero_-_lidia.jfif` → `src/assets/founders/ligia-rio.jpg`
- Copiar `user-uploads://Alinne.jfif` → `src/assets/founders/alinne-pantanal.jpg`
- Reaproveitar imagens já existentes em `src/lib/expedicao-images.ts` para os blocos de apoio (sem gerar novas).

---

## 2. Nova página `/quem-somos` (`src/routes/quem-somos.tsx`)

Estrutura editorial cinematográfica, leitura fluida, blocos curtos com muito respiro:

1. **Hero institucional** — full-bleed da Lígia no rio, gradient cinematográfico, eyebrow `BOUTIQUE EQUESTRIAN EXPEDITIONS`, título display e subtítulo curto.
2. **História da marca** — duas colunas, texto editorial com drop-cap, parágrafos curtos, citação em destaque.
3. **Diferenciais** — 4 itens em grid minimalista (criação própria de cavalos, curadoria boutique, conexão com natureza, transformação real). Ícones discretos line-art.
4. **Fundadoras** — bloco premium:
   - Lígia: portrait editorial (foto do rio) em moldura orgânica + storytelling de transformação/cura/propósito.
   - Alinne: portrait (foto Pantanal) + storytelling estrutura/gestão/expansão.
   - Composição assimétrica, offset refinado, eyebrow com nome + papel.
5. **Na Mídia** (replicado da Home, versão expandida) — Globo, Revista Portugal, Revista Horse.
6. **Encerramento emocional** — frase manifesto + CTA duplo (`/expedicoes` + WhatsApp).

Adicionar `head()` com meta próprias (title, description, og).
Adicionar link no header (`src/components/site-header.tsx`) e no footer.

---

## 3. Componente `EditorialFrame` (`src/components/editorial-frame.tsx`)

Wrapper reutilizável para imagens premium. Variantes:
- `portrait` — proporção 4/5, leve offset com bloco de cor cobre/floresta atrás, sombra suave.
- `landscape` — proporção 21/9, borda interna sutil 1px areia/20, grão editorial leve via `mix-blend-overlay`.
- `organic` — borda com `border-radius` assimétrico suave (não exagerado).

Aplicar em: Quem Somos (fundadoras + hero blocos), Home (bloco história), página de expedição (gallery hero).

---

## 4. Novo Hero da Home (`src/routes/index.tsx`)

- Substituir fundo atual pela foto da Lígia (`ligia-rio.jpg`).
- Manter overlay cinematográfico (gradient carvao→transparente esquerda + base).
- Manter copy, eyebrow, CTAs e LanguageSwitcher mobile.
- Ajustar `object-position` para manter o rosto/cavalo no foco em todos os breakpoints.
- Preload da imagem no `head()` da rota.

---

## 5. Bloco "Na Mídia" (`src/components/na-midia.tsx`)

Faixa discreta, premium, **na Home** (entre seções existentes, sem inflar) e **em /quem-somos** (versão maior).

- Eyebrow: `RECONHECIDAS POR`
- 3 cards horizontais minimalistas com wordmark editorial (tipografia serif/uppercase — sem logos oficiais, evita problema de marca):
  - **GLOBO** → abre modal com embed YouTube `lAsPBK_D7Mw` (reaproveitar `VideoCinematic` modal).
  - **REVISTA HORSE** → abre nova aba (`revistahorse.com.br/...`).
  - **REVISTA BSC PORTUGAL** → tenta modal iframe; fallback botão "Abrir revista" em nova aba (X-Frame-Options costuma bloquear).
- Hover sutil cobre, divisores verticais finos entre itens, sem bagunça visual.

---

## 6. Termos / Políticas — refinamento visual

Refinar (sem mudar conteúdo legal estrutural) `src/routes/termos.tsx`, `src/routes/regras.tsx`, `src/routes/privacidade.tsx`:

- Layout editorial: coluna max-w-3xl, tipografia display nos títulos, eyebrow numerada por seção (`01 — RESPONSABILIDADE`).
- Drop-cap no primeiro parágrafo.
- Bloco de destaque para itens críticos (peso 110kg, risco, cancelamento) com borda cobre à esquerda.
- Sumário lateral sticky em desktop com âncoras.
- Aviso elegante no topo: "Documento em revisão jurídica final".

Na página de reserva, melhorar o card de aceites (checkboxes) com micro-tipografia premium e ícone discreto de ferradura/cavalo.

---

## 7. Consentimento de Cookies (`src/components/cookie-consent.tsx`)

Barra inferior premium, persistida em `localStorage`:

- Largura `max-w-4xl`, fundo `bg-carvao/95 backdrop-blur`, borda cobre 1px topo.
- SVG inline minimalista de silhueta de cavalo à esquerda (line-art, traço 1px cobre).
- Texto curto + 2 botões: `Aceitar` (cobre filled) e `Apenas essenciais` (outline).
- Link discreto para `/privacidade`.
- Slide-up sutil ao montar; fade-out ao escolher.
- Montar uma vez em `__root.tsx`.

---

## 8. Modais — padronização premium

Criar `src/components/premium-modal.tsx` (wrapper sobre `Dialog`) com:
- Overlay `bg-carvao/85 backdrop-blur-md`
- Container `bg-areia/98`, borda fina cobre/15, sombra elegante
- Botão fechar circular cobre top-right
- Animação fade+scale suave

Aplicar onde já existem dialogs (reserva sucesso, vídeo, mídia).

---

## 9. i18n

Adicionar chaves novas (`quemSomos.*`, `naMidia.*`, `cookies.*`, `editorial.*`) nos 3 locales (`pt`, `en`, `es`). Textos institucionais traduzidos com tom premium.

---

## 10. Performance

- `loading="lazy"` + `decoding="async"` em todas as novas imagens (exceto hero).
- Preload do novo hero da Lígia.
- Componente Na Mídia carrega iframe YouTube **só ao abrir** modal (já é o padrão do `VideoCinematic`).
- Cookie banner monta com `requestIdleCallback` fallback `setTimeout(800)` para não atrapalhar LCP.

---

## Arquivos

**Criar:**
- `src/routes/quem-somos.tsx`
- `src/components/editorial-frame.tsx`
- `src/components/na-midia.tsx`
- `src/components/cookie-consent.tsx`
- `src/components/premium-modal.tsx`
- `src/assets/founders/ligia-rio.jpg` (copy)
- `src/assets/founders/alinne-pantanal.jpg` (copy)

**Editar:**
- `src/routes/index.tsx` (hero novo + bloco Na Mídia)
- `src/routes/termos.tsx`, `src/routes/regras.tsx`, `src/routes/privacidade.tsx` (refinamento editorial)
- `src/routes/reserva.$slug.tsx` (card de aceites premium)
- `src/components/site-header.tsx` (link Quem Somos)
- `src/components/site-footer.tsx` (link Quem Somos)
- `src/routes/__root.tsx` (montar CookieConsent)
- `src/i18n/locales/{pt,en,es}/common.json`

**Não tocar:** identidade visual em `src/styles.css`, estrutura de expedições, lógica de reserva (apenas o visual dos aceites), tokens de cor.
