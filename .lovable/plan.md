## Problema

No mobile, o painel de Acessibilidade (`src/components/accessibility-panel.tsx`) está posicionado como um cartão flutuante fixo (`bottom-40 right-5 w-[20rem]`). Em telas pequenas (≤360px, ou em paisagem), ele:

- Estoura a largura da tela (1.25rem + 20rem ≈ 340px) → corta o conteúdo lateral.
- Sobe acima da área visível por causa do `bottom-40` + `max-h-[70vh]`, ficando com topo cortado em telas curtas.
- Não respeita `safe-area-inset` (notch / barra inferior do iOS).

Além disso, a estrutura tem muitos grupos visuais (narração + toggles + radios + VLibras + reset) num cartão pequeno, o que dificulta a navegação sequencial por leitor de tela e por toque.

## O que vou fazer

Mexer **apenas** em `src/components/accessibility-panel.tsx`. Sem mudar lógica de TTS, VLibras ou preferências persistidas.

### 1. Layout responsivo (bottom sheet no mobile, painel flutuante no desktop)

- **Mobile (`< md`)**: painel vira *bottom sheet* full-width.
  - `inset-x-0 bottom-0`, largura total, cantos arredondados só no topo.
  - Backdrop escuro semi-transparente atrás (clicável para fechar).
  - `aria-modal="true"` quando aberto no mobile, com trava de scroll do body.
  - Respeita `padding-bottom: env(safe-area-inset-bottom)`.
  - Animação slide-up (respeita `prefers-reduced-motion` e a pref `reduceMotion`).
- **Desktop (`md+`)**: mantém o cartão flutuante atual (ajustado para não cortar — `max-h-[min(70vh,40rem)]`, `bottom-28`).
- Botão flutuante (FAB) ganha `bottom: max(1.25rem, env(safe-area-inset-bottom))` para não colidir com a barra do iOS, e some/desce quando o sheet está aberto no mobile.

### 2. Simplificar para leitor de tela e toque

- Reagrupar em **3 seções claras** com `<section aria-labelledby>` e cabeçalho visível:
  1. **Narração** (Ouvir / Parar / Ler ao focar)
  2. **Leitura** (tamanho do texto, alto contraste)
  3. **Movimento e Libras** (reduzir animações, VLibras)
- Cada controle:
  - Alvo de toque ≥ 48×48 (atualmente `py-2` / `h-9` → subir para `min-h-12`).
  - Texto maior e mais direto ("Ler a página", "Parar leitura", "Texto maior", "Texto grande", em vez de "A / A+ / A++").
  - `aria-pressed` em vez de `role="switch"` quando fizer sentido — mais previsível em leitores móveis.
- Ao abrir: foco vai para o título do painel; ao fechar: foco volta ao FAB.
- Anúncios: adicionar `aria-live="polite"` invisível que diz "Texto grande ativado", "Alto contraste ativado", "Leitura iniciada", etc.
- ESC fecha; clique no backdrop fecha; botão "Fechar" continua visível.
- Reduzir hierarquia visual (menos badges/eyebrows pequenos) para o painel "respirar" e não parecer denso.

### 3. Verificação

- Testar nos viewports 320, 360, 390 e 768 px (sandbox tem screenshot).
- Confirmar que: nada é cortado, FAB não cobre conteúdo crítico, painel abre/fecha por teclado, foco entra/sai corretamente, e nenhuma preferência salva é perdida.

## Fora de escopo

- Não vou mudar VLibras, TTS, persistência em `localStorage`, nem o design system (`src/styles.css`).
- Não vou tocar em outras páginas/componentes.
