# Plano de ajustes — UX, acessibilidade e i18n

## 1. Ícone do WhatsApp (substituir todos os "balões" de mensagem)

Criar componente `src/components/icons/whatsapp-icon.tsx` — SVG oficial do WhatsApp, monocromático (`currentColor`), traço minimalista, sem fundo (transparente). Aceita `className` para herdar tamanho/cor (branco em fundo escuro, cobre em fundo claro).

Substituir **todas** as ocorrências de `MessageCircle` do `lucide-react` que se referem a contato/WhatsApp:
- `src/components/site-header.tsx` (botão "WhatsApp" do header + drawer)
- `src/components/data-card.tsx` ("Reservar")
- `src/routes/expedicoes.$slug.tsx` (2 CTAs "Reservar Agora")
- `src/routes/minha-reserva.tsx` ("Continuar pelo WhatsApp")
- `src/routes/contato.tsx` (card de WhatsApp)
- `src/components/whatsapp-float.tsx` já usa SVG próprio — padronizar para usar o novo componente.

## 2. Ícone de acessibilidade — mais moderno e sofisticado

O FAB hoje usa `Accessibility` (lucide), que parece símbolo institucional antigo. Trocar por um glifo customizado em SVG: figura humana estilizada com aura/círculo concêntrico sutil — universal, sem cadeira de rodas, alinhado ao "Universal Access" moderno (formato de pessoa centrada com braços abertos dentro de círculo fino).

- Criar `src/components/icons/accessibility-glyph.tsx` (SVG inline, traço fino 1.5, `currentColor`, transparente).
- Trocar `<Accessibility />` em `accessibility-panel.tsx` pelo novo glifo.
- Refinar visual do FAB: manter gradiente cobre, reduzir ring para `ring-1`, suavizar pulse (apenas em hover), garantir contraste WCAG do ícone branco sobre cobre.

## 3. Autoplay do carrossel — mais fluido

Em `src/components/carrossel-narrativo.tsx`:
- Reduzir `delay` de **5500ms → 4200ms**.
- Adicionar `duration: 28` no Embla (transição entre slides um pouco mais rápida e suave).
- Garantir que `Autoplay` rode em desktop: hoje `stopOnMouseEnter: true` pausa quando o mouse entra na seção; trocar para `stopOnMouseEnter: false` + `stopOnInteraction: false` para fluxo contínuo. Manter pausa ao usar setas/teclado por `stopOnFocusIn: true`.
- Confirmar swipe mobile (`touch-pan-y` já presente).

## 4. Tradução global do site (i18n)

**Estado atual:** apenas `src/routes/index.tsx` e header/footer consomem `useTranslation`. Todas as outras páginas públicas têm texto fixo em PT. Por isso a troca de idioma "só funciona na Home".

**Escopo desta entrega — páginas públicas:**
1. `expedicoes.tsx` (listagem)
2. `expedicoes.$slug.tsx` (detalhe — hero, breadcrumb, blocos comerciais, FAQ, CTAs, seção carrossel, "O que está incluso", etc.)
3. `datas.tsx` (Próximas datas)
4. `quem-somos.tsx`
5. `contato.tsx`
6. `na-midia.tsx`
7. `minha-reserva.tsx`
8. `reserva.$slug.tsx` (labels do formulário, validações, confirmação)
9. `marcas.canastra-a-cavalo.tsx`, `marcas.cavalgadas.tsx`, `marcas.elas-na-sela.tsx`
10. `privacidade.tsx`, `termos.tsx`, `regras.tsx`
11. Componentes compartilhados ainda hardcoded: `historias-editorial.tsx`, `data-card.tsx`, `expedicao-card.tsx`, `galeria-editorial.tsx`, `depoimentos-shorts.tsx`, `marca-cross-nav.tsx`, `na-midia.tsx`, `cookie-consent.tsx`, `editorial-frame.tsx`, `accessibility-panel.tsx`, `page-loader.tsx`, `site-footer.tsx` (partes que faltam).

**Como será feito:**
- Expandir os 3 JSONs `src/i18n/locales/{pt,en,es}/common.json` com namespaces por página: `expedicoes`, `expedicaoDetalhe`, `datas`, `quemSomos`, `contato`, `naMidia`, `reserva`, `minhaReserva`, `marcas`, `legal`, `a11y`, `cookies`, `common` (botões, labels recorrentes).
- Substituir strings nas páginas/componentes por `t("namespace.chave")`.
- Conteúdo dinâmico vindo do banco (nomes/descrições de expedições, FAQ, "o que está incluso") **permanece em PT** — esses textos vêm do admin e exigiriam tradução manual no CMS. Marcar com TODO; UI já fica internacionalizada.
- `meta` (title/description SEO) das rotas também passa a usar i18n.

**Importante sobre custo/tempo:** este item é o maior do plano — envolve tocar ~25 arquivos e dezenas de strings. Vou executar em um único passe completo e consistente.

## 5. VLibras realmente funcional

Hoje o componente `vlibras.tsx` já injeta o script oficial do Governo Federal e o botão de "Tradutor para Libras" no painel de acessibilidade dispara `[vw-access-button].click()`. A causa provável de "não funciona" é:
- o widget oficial está oculto/cortado por z-index ou pelo botão do WhatsApp;
- o `<div vw>` não está ganhando classe `enabled` antes do script carregar.

Correções:
- Refatorar `src/components/vlibras.tsx`:
  - injetar `<div vw class="enabled">` corretamente, com `vw-plugin-top-wrapper` aninhado conforme docs oficiais;
  - aguardar `onload` do script para chamar `new window.VLibras.Widget(...)`;
  - aplicar CSS para posicionar o widget acima do FAB de acessibilidade e do WhatsApp (`#vlibras-plugin` z-index alto, margem inferior elevada);
  - esconder o botão padrão do VLibras (`[vw-access-button] { display: none !important }`) — quem dispara é o nosso botão "Ativar" no painel, que mantém a estética premium.
- Validar no preview: clicar em "Ativar" abre o intérprete real (avatar Ícaro/Hosana), com tradução funcional. Esta é a solução padrão brasileira, gratuita, leve e oficial; alternativas comerciais (Hand Talk) exigem chave paga — não recomendo.

## 6. Revisão de acessibilidade real (a11y)

- `aria-label` em todos os botões icon-only restantes (varredura nas páginas).
- `aria-current="page"` nos links de navegação ativos do header.
- Garantir `focus-visible` consistente (ring cobre) em todos os botões/links via `src/styles.css`.
- `role="main"`/`<main>` único — já existe no `__root.tsx`.
- Hierarquia de headings: revisar páginas para evitar pulos (h1→h3).
- Contraste: revisar `text-areia/55`, `text-foreground/40` em fundos claros — subir para `/70` mínimo.
- `lang` no `<html>` já é trocado pelo `i18n` ao mudar idioma — confirmar.
- Navegação por teclado: garantir que drawer mobile (`site-header`) traveja foco e ESC fecha.

## Detalhes técnicos

- Nenhuma mudança em lógica de negócio, banco, rotas, fluxo de reserva, preços ou datas.
- Nenhuma dependência nova (VLibras é script externo já presente).
- `embla-carousel-autoplay` já instalado — apenas ajuste de opções.
- Arquivos novos: 2 ícones SVG + ampliação de 3 JSONs de locale.
- Arquivos editados: ~25 (lista acima).

## Fora de escopo

- Painel admin (não é público; permanece em PT).
- Tradução de conteúdo dinâmico do banco (expedições, FAQ vindos do CMS).
- Mudança da identidade visual ou layout geral.
- Trocar VLibras por solução paga (Hand Talk).
