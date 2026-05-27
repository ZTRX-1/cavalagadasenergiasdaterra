## Objetivo
Adicionar um carrossel editorial premium nas páginas de cada expedição, logo abaixo da capa, seguindo a narrativa visual definida (8 cenas em ordem). Primeira aplicação: **Jericoacoara**, com as 8 fotos enviadas exatamente na ordem recebida. Mesma estrutura ficará pronta para as demais expedições, alimentadas por dados.

## Mudanças

### 1. Novas imagens (Jericoacoara)
Copiar as 8 fotos enviadas para `src/assets/fotos/jericoacoara/01.jpg`…`08.jpg`, na ordem:
1. Capa — cavaleira na duna ao nascer do sol
2. Paisagem — duna ondulada com palmeiras
3. Cavalgada — silhuetas na praia ao pôr do sol
4. Conexão — mulher e cavalo na lagoa
5. Roteiro exclusivo — travessia na água
6. Grupo — sete cavaleiros enfileirados na lagoa
7. Hospedagem — piscina iluminada à noite
8. Encerramento — trio em silhueta no pôr do sol das dunas

A foto 1 vira o novo **hero** de Jericoacoara (substitui o placeholder atual).

### 2. Novo componente `CarrosselNarrativo`
`src/components/carrossel-narrativo.tsx`, baseado em **embla-carousel-react** (já instalado, mesma lib do `ui/carousel`).

Características:
- Swipe nativo no mobile, drag no desktop, snap suave (`align: "center"`, `loop: true`).
- Slide central em destaque (90vw mobile, ~62vw desktop, aspect 4/5), vizinhos com leve opacidade/scale para efeito cinematográfico.
- Legenda editorial sobreposta no canto inferior: eyebrow ("01 — Paisagem icônica") + título curto (ex.: "Dunas de Jericoacoara").
- Navegação minimalista: setas circulares discretas (visíveis só ≥ md), barra de progresso fina em vez de bolinhas, contador "03 / 08".
- Vinheta sutil + grão leve nas imagens (mesma linguagem de `EditorialFrame`).
- Autoplay desligado por padrão; `prefers-reduced-motion` respeitado.
- Lazy load nos slides fora do viewport; `fetchpriority="high"` apenas no primeiro.
- Acessível: `role="region" aria-roledescription="carousel"`, slides com `aria-label`, setas com `aria-label`, navegação por teclado (← →).

### 3. Dados narrativos por expedição
Em `src/lib/expedicao-images.ts`:
- Adicionar imports das 8 fotos de Jericoacoara.
- Trocar `SLUG_IMAGE["jericoacoara"]` para `jeri01`.
- Criar novo mapa `SLUG_NARRATIVA: Record<string, { src: string; eyebrow: string; titulo: string }[]>` com a sequência das 8 cenas para `jericoacoara`. Demais expedições ficam vazias por enquanto (vamos preencher depois, expedição por expedição).
- Helper `getExpedicaoNarrativa(slug)`.

### 4. Integração na página da expedição
`src/routes/expedicoes.$slug.tsx`:
- Logo após o `<section>` do hero (e antes do bloco do vídeo da Canastra), renderizar uma nova `<section className="bg-background py-20 md:py-28">` com eyebrow "A experiência em imagens" + título curto + o `CarrosselNarrativo`, **apenas quando** `getExpedicaoNarrativa(slug).length > 0`.
- A seção atual "Galeria — A expedição em imagens" (que usa `GaleriaEditorial`) continua existindo para as expedições que ainda dependem dela; quando houver narrativa, ela é ocultada para não duplicar.

### 5. Performance
- Imagens são bundladas via Vite (`@/assets/...`) — beneficiam de hashing e cache longo.
- `loading="lazy"` + `decoding="async"` em todos os slides exceto o primeiro.
- Embla é leve (~5kb) e já está no bundle.

## Detalhes técnicos
- Sem novas dependências.
- Tokens existentes: `cobre`, `areia`, `carvao`, `font-display`, `eyebrow`.
- Mobile-first: slide ocupa ~88vw, padding lateral generoso para preview dos vizinhos.
- Sem alterações em backend, rotas ou tipos do Supabase.

## Próximos passos (fora deste plano)
Após aprovação e validação visual em Jeri, replicaremos a mesma estrutura para Canastra, Mantiqueira, Berço do Marchador, Peru, Patagônia e Caminho de Santiago — uma expedição por vez, conforme você enviar as fotos na ordem narrativa.