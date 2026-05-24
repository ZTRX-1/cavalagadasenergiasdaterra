## Refinamento cirúrgico final — curadoria visual + i18n PT/EN/ES

Foco: **reduzir**, não adicionar. Recuperar o respiro premium da Home e instalar arquitetura multilíngue elegante.

---

### 1. Curadoria visual (reduzir imagens)

**Princípio:** apenas 1 imagem-âncora por seção. Blocos de texto vivem em fundo `carvao`/`areia` com tipografia respirada.

- **Home** — manter apenas: hero, 1 imagem cinematográfica em "Quem somos", cards de expedição (já têm foto), 1 still atmosférico antes do CTA final. Remover: imagem em "Inclui", "Passos", "FAQ", "Depoimentos".
- **Páginas de marca** (`canastra-a-cavalo`, `elas-na-sela`, `cavalgadas`) — reduzir galerias de 20+ para **6-8 imagens curadas**, escolhidas por força cinematográfica (drone, silhueta, atmosfera, cavalo/natureza).
- **Página de expedição** (`expedicoes.$slug`) — hero + galeria editorial enxuta (máx 8 imagens).
- Curar `SLUG_GALERIA` em `expedicao-images.ts` priorizando frames com composição forte (drones de cachoeira, silhuetas, pôr-do-sol, retratos de cavalo). Excluir fotos de almoço, mesa, bandeiras, grupos posados.

### 2. Galeria editorial v2

Reescrever `galeria-editorial.tsx`:
- Ritmo editorial: **1 full-bleed → 2 lado a lado → 1 retrato grande + 1 paisagem → 1 full-bleed final**.
- Máx 6-8 fotos. Espaçamento generoso (gap-8 → gap-12). Aspect ratios variados (16/9, 4/5, 3/2).
- Sem hover-zoom barulhento, apenas fade sutil. Legendas opcionais em `font-eyebrow` discretas.

### 3. Contraste e legibilidade

- Overlay padrão em hero: `bg-carvao/65` + gradient inferior. Padronizar via classe utilitária `.hero-scrim` em `styles.css`.
- Textos sobre imagem **sempre** dentro de container com gradient ou scrim. Auditar `marcas.*.tsx` e `expedicoes.$slug.tsx`.
- Mobile: aumentar overlay para `/75` (texto pequeno sofre mais).

### 4. Home — recuperar minimalismo

Estrutura final enxuta:
```
HERO (full-screen, headline + 1 CTA)
QUEM SOMOS (texto + 1 imagem lateral)
EXPEDIÇÕES EM DESTAQUE (3 cards)
INCLUI (6 ícones, sem imagem)
PRÓXIMAS DATAS (lista enxuta)
HISTÓRIAS (bloco emocional — ver §5)
COMO FUNCIONA (4 passos, sem imagem)
FAQ (acordeão, sem imagem)
CTA FINAL (1 imagem cinematográfica + headline)
```

### 5. Histórias de quem atravessou conosco

Transformar de cards genéricos em **bloco editorial emocional**:
- Layout tipo "diário de expedição": citação grande em `font-display` itálico, nome/local discreto, **1 imagem em retrato** ao lado do relato em destaque (rotativo / carrossel suave).
- Fundo `carvao` profundo, tipografia respirada, scroll horizontal sutil em desktop.
- Sem estrelas, sem cards uniformes — sensação de página de revista.

### 6. Multilíngue (PT/EN/ES)

**Stack:** `react-i18next` + `i18next` + `i18next-browser-languagedetector` (SSR-safe, leve, padrão).

Estrutura:
```
src/i18n/
  index.ts              -> init i18next
  locales/
    pt/common.json
    en/common.json
    es/common.json
```

Implementação:
- Init em `src/start.ts` (client) — fallback PT, detecção via localStorage + navigator.
- Provider montado em `__root.tsx`.
- Hook `useTranslation()` em todos os componentes de texto.
- **Seletor no header** — versão minimalista: `PT · EN · ES` em `font-eyebrow text-[0.7rem]`, separador `·`, ativo em `text-cobre-soft`, inativo em `text-areia/50`. No mobile, dentro do drawer abaixo dos links.
- Persistência em `localStorage` (`i18nextLng`).

**Escopo da tradução inicial** (chaves organizadas por namespace):
- `header` (nav, CTA "Reservar")
- `home.hero`, `home.quemsomos`, `home.inclui`, `home.passos`, `home.faq`, `home.historias`, `home.cta`
- `expedicoes.*` (labels: "A partir de", "Próximas datas", "Inclui", "Roteiro", "Requisitos", "Pré-reservar")
- `reserva.*` (formulário)
- `footer.*`

Conteúdo dinâmico do banco (nome de expedição, descrição, roteiro) permanece em PT na v1 — adicionar colunas `_en`/`_es` é fora de escopo deste refinamento (sinalizar como próxima fase).

### 7. Direção final

- Tipografia: aumentar `tracking` e `leading` em headlines display.
- Espaçamento vertical entre seções: padronizar `py-24 md:py-32` (mais respiro).
- Animações: fade-in suave on-scroll (já existe via framer-motion onde aplicável), nada agressivo.
- Remover quaisquer hovers "saltitantes" remanescentes.

---

### Arquivos afetados

**Modificar:**
- `src/routes/index.tsx` (reduzir imagens, reescrever Histórias)
- `src/routes/marcas.*.tsx` (curar galerias)
- `src/routes/expedicoes.$slug.tsx` (galeria enxuta)
- `src/components/galeria-editorial.tsx` (reescrita v2)
- `src/components/site-header.tsx` (seletor de idioma)
- `src/components/site-footer.tsx` (i18n)
- `src/lib/expedicao-images.ts` (curar arrays)
- `src/styles.css` (utilitário `.hero-scrim`, espaçamentos)
- `src/start.ts` + `src/routes/__root.tsx` (init i18n)

**Criar:**
- `src/i18n/index.ts`
- `src/i18n/locales/{pt,en,es}/common.json`
- `src/components/language-switcher.tsx`
- `src/components/historias-editorial.tsx` (nova seção emocional)

**Instalar:**
- `i18next`, `react-i18next`, `i18next-browser-languagedetector`

### Fora de escopo (sinalizar)

- Tradução do conteúdo dinâmico do banco (nomes/descrições de expedição) — requer migração com colunas `_en`/`_es`. Posso fazer em seguida se quiser.
- Geração de novas imagens — vamos apenas selecionar entre as existentes.
