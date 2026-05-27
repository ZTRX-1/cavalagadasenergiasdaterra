## Mudanças solicitadas

### 1. Home — substituir título do manifesto
Em `src/i18n/locales/pt/common.json` (e equivalentes `en` / `es`), atualizar `manifesto.title`:
- De: "Não é um passeio. É uma jornada que permanece."
- Para: "Expedições a cavalo por paisagens extraordinárias, conectando natureza, cultura, gastronomia e experiências que permanecem para a vida toda."

Como em EN/ES o usuário só citou a versão PT, traduzir o novo título de forma equivalente nos locales `en` e `es` mantendo o tom premium. Não mexer em nenhum outro campo.

### 2. Carrossel narrativo em todas as expedições
Hoje só `jericoacoara` tem entradas em `SLUG_NARRATIVA` (em `src/lib/expedicao-images.ts`). Para as demais expedições com fotos (`serra-da-canastra`, `mantiqueira-refugio`, `peru-vale-do-colca`, `patagonia-gaucha`, `caminho-de-santiago`), gerar automaticamente cenas reusando as fotos já existentes em `SLUG_GALERIA` (até 8 primeiras), sem inventar legendas técnicas.

Abordagem:
- Adicionar fallback em `getExpedicaoNarrativa(slug)`: se não existir narrativa curada, retornar as primeiras 8 fotos da galeria com `eyebrow: ""` e `titulo: ""` (sem texto). Assim o layout da página fica idêntico ao de Jericoacoara sem precisar duplicar a seção condicional.
- Manter Jericoacoara com as legendas atuais.
- Em `src/routes/expedicoes.$slug.tsx`, a seção "Carrossel editorial" já é renderizada quando `narrativa.length > 0` — passará a aparecer em todas. A seção "Galeria" antiga (que só renderiza quando `narrativa.length === 0`) deixa de ser exibida nessas páginas, ficando o layout unificado.
- Aplicar os ajustes de espaçamento/hero do `isJeri` para todas as expedições (renomear flag para algo neutro ou simplesmente remover o gating `isJeri` nesses paddings, mantendo o resto). O hero continua usando `object-cover`; aplico o tratamento mais compacto (`min-h-[78svh] md:min-h-[62svh] lg:min-h-[64svh]`) para todas, mas removendo o `object-[center_28%]` específico de Jericoacoara (esse é único da composição da Lígia com o cavalo).
- Em `CarrosselNarrativo` (figcaption), esconder o bloco da legenda quando `titulo` estiver vazio para não aparecer espaço/gradiente vazio.

### 3. Autoplay suave no carrossel
Em `src/components/carrossel-narrativo.tsx`, adicionar autoplay via plugin oficial do Embla:
- Instalar `embla-carousel-autoplay`.
- Configurar com `delay: 5500ms`, `stopOnInteraction: false`, `stopOnMouseEnter: true` para experiência contemplativa.
- Manter setas, swipe, teclado e progress bar funcionando.
- `loop: true` já está ativo, então a passagem é contínua.

### Escopo / fora de escopo
- Não mexer em fluxo de reserva, preços, datas, textos comerciais, outras seções da home, header/footer, marcas ou admin.
- Não alterar a curadoria narrativa de Jericoacoara.
- Manter a hero image e composição em destaque no topo de cada expedição.

### Arquivos afetados
- `src/i18n/locales/pt/common.json` (+ `en/common.json`, `es/common.json`)
- `src/lib/expedicao-images.ts` — fallback no `getExpedicaoNarrativa`
- `src/routes/expedicoes.$slug.tsx` — generalizar paddings/hero
- `src/components/carrossel-narrativo.tsx` — autoplay + ocultar caption vazia
- `package.json` — nova dep `embla-carousel-autoplay`
