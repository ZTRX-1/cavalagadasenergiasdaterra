# Plano de Otimização de Performance

Baseado em auditoria completa do projeto. 15 gargalos identificados, agrupados em 4 ondas executáveis sem quebrar nenhuma funcionalidade.

## Onda 1 — Quick wins de bundle e carregamento crítico

**Impacto: redução estimada de 40–60% do JS inicial e ~300ms no LCP.**

1. **Ativar code splitting automático do TanStack Router** — `vite.config.ts`: `autoCodeSplitting: true`. Cada rota vira chunk independente; a área `/admin` deixa de ser baixada por visitantes do site público.
2. **Compressão Brotli + Gzip no build** — adicionar `vite-plugin-compression2` gerando `.br` e `.gz` para todo JS/CSS/SVG.
3. **Manual chunks de vendor** — separar `recharts`, `@supabase/*`, `i18next/react-i18next`, `embla-carousel`, `@dnd-kit` em chunks próprios para melhor cache entre deploys.
4. **Google Fonts não-bloqueante** — remover `@import url(...)` do `src/styles.css`, mover para `index.html` como `<link rel="preconnect">` + `<link rel="preload" as="style">` + `<link rel="stylesheet" media="print" onload="this.media='all'">`.
5. **Remover import duplicado de `@/i18n`** — manter apenas em `src/main.tsx`.

## Onda 2 — Lazy loading de libs pesadas

**Impacto: −500KB jsPDF, −150KB react-image-crop, −300KB recharts no caminho não-admin.**

1. **jsPDF dinâmico** — em `src/lib/admin/participantes-pdf.ts`, converter para função async que faz `const { default: jsPDF } = await import("jspdf")` apenas ao clicar exportar.
2. **`ImageCropper` lazy** — `React.lazy` no `src/routes/admin._authenticated.perfil.tsx`, envolvido em `<Suspense>` dentro do Dialog.
3. **Recharts lazy** — `React.lazy` para componentes que usam `AreaChart` em `admin.index.tsx` e `admin.financeiro.tsx`, com skeleton enquanto carrega.
4. **`canastraVideoPoster` condicional** — import dinâmico só quando a expedição é `entre-redeas-e-cachoeiras`.

## Onda 3 — React Query e dados

**Impacto: menos refetches, menos tráfego Supabase, navegação back/forward instantânea.**

1. **Defaults globais melhores** em `src/router.tsx`:
   - `refetchOnWindowFocus: false`
   - `gcTime: 30 * 60_000` (30 min)
   - manter `staleTime: 60_000` e `retry: 1`
2. **Paginação em listas admin** — `listLeads`, `listReservas`, `listParticipantes` recebem `{ limit, offset }` opcionais (default 100) com `.range()`, e seletores explícitos das colunas usadas nas tabelas (não mais `select("*")`).
3. **Cache key do dashboard estável** — em `admin._authenticated.index.tsx`, usar o nome do preset (`hoje`/`semana`/`mes`/`ano`) na queryKey em vez do ISO timestamp, evitando cache miss a cada render.
4. **`CentralOperacional`** — aumentar `staleTime` de 30s → 2min e desativar refetch on focus.

## Onda 4 — Imagens, CSS e UX visual

**Impacto: melhor LCP, menos CLS, FPS estável no carrossel.**

1. **Hero único na home** — substituir as 3 `<img fetchPriority="high">` por uma única, com `object-position` controlado por classes responsivas.
2. **Atributos `width`/`height` + `decoding="async"`** em todas as `<img>` de `carrossel-narrativo.tsx`, `galeria-editorial.tsx` e hero da expedição para zerar CLS.
3. **Blur do carrossel só no slide ativo** — limitar `blur-2xl` ao slide `selectedIndex` do Embla; demais slides ficam com `filter: none` e `content-visibility: auto`.
4. **Header scroll listener idempotente** — em `site-header.tsx`, comparar valor antes de `setScrolled` (evita re-render desnecessário).
5. **Imagens estáticas com `loading="lazy"`** onde já não está, exceto LCP.

## Não incluído nesta passada (justificativa)

- **Conversão massiva JPG → WebP/AVIF (38MB de fotos)**: exige rodar pipeline de imagens e revalidar visualmente todas as expedições. Recomendo fazer em PR dedicado depois desta otimização, ou migrar gradualmente para o CDN de assets do Lovable (já estamos usando em `entre-redeas` e `travessia`).
- **Refatoração de `expedicao-images.ts` para imports dinâmicos**: alto risco de regressão visual em todas as páginas de expedição. Melhor abordar junto com a migração para CDN.
- **Virtualização de listas (`@tanstack/react-virtual`) em leads/participantes**: ganho real só com 500+ itens; com paginação da Onda 3 fica resolvido por enquanto.
- **RPC consolidada no Supabase para o dashboard**: requer migration nova e validação de permissões; vale como follow-up.

## Detalhes técnicos

- Todas as mudanças preservam APIs públicas dos componentes/funções.
- Lazy imports usam `React.lazy` + `<Suspense fallback={...}>` com os skeletons já existentes no projeto.
- `vite-plugin-compression2` é zero-config para servir assets pré-comprimidos no Lovable Hosting (que aceita `.br`/`.gz`).
- Paginação adiciona parâmetros opcionais — chamadas existentes sem `limit` continuam funcionando (default mantém comportamento atual, só explicita o teto).
- Cache key do dashboard: a chave atual `[from, to]` muda a cada render porque o range é recalculado; trocar para `[presetKey]` faz o cache realmente funcionar quando o usuário alterna presets ida-e-volta.

## Verificação ao final

- `bun run build` deve passar sem erros.
- Inspeção via Playwright do `/` e `/admin` para confirmar que não há regressão visual ou de console.
- Conferência de tamanho dos chunks no output do build.
