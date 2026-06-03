# Preview ao vivo e dicas de contexto na edição de expedição

Objetivo: enquanto você edita uma expedição no painel interno, ver em tempo real como cada alteração aparece na página pública — e, em cada campo, uma legenda dizendo "isso aparece em tal lugar do site".

## O que muda na tela de edição

Arquivo: `src/routes/admin._authenticated.expedicoes.$id.tsx`

### 1. Layout em duas colunas (desktop)

No desktop (≥1280px) a tela passa a ter:

```text
┌──────────────────────────────┬──────────────────────────┐
│  Abas + formulário (60%)     │  Preview ao vivo (40%)   │
│  Geral / Roteiro / Mídia...  │  (sticky, rola junto)    │
└──────────────────────────────┴──────────────────────────┘
```

- No mobile/tablet o preview vira um botão "Ver preview" que abre um drawer lateral, para não atrapalhar a edição num espaço pequeno.
- Toggle no topo: `Preview: Desktop | Mobile` para ver as duas larguras.
- Toggle "Abrir em nova aba" para checar a página real publicada (rascunho continua só no preview interno).

### 2. Preview ao vivo

Novo componente `src/components/admin/expedicao-preview.tsx`:

- Recebe o estado atual do formulário (mesmo objeto que já é editado em memória, **antes de salvar**) e renderiza uma versão enxuta da página `expedicoes/$slug` com: capa, nome, descrição curta/longa, duração, nível, preço, roteiro, "como chegar", próximas datas, galeria.
- Reusa os mesmos componentes visuais da página pública sempre que possível, dentro de um container `iframe`-like (na verdade um `<div>` escalado) para simular largura de 1280px ou 390px.
- Atualiza a cada tecla digitada (estado local já existe), sem precisar salvar.
- Mostra um badge "Pré-visualização — alterações não salvas" enquanto há diff em relação ao banco.

### 3. Dicas contextuais em cada campo

Novo helper em `src/components/admin/admin-section.tsx`:

- Estende `AdminField` com uma prop opcional `ondeAparece` (texto curto) e `previewTarget` (id da seção no preview).
- Abaixo do label aparece uma linha discreta: *"Aparece em: capa da expedição (título principal)"*, *"Aparece em: bloco 'O que está incluído' na página pública"*, etc.
- Ao focar o campo, a seção correspondente no preview ganha um realce dourado por ~1.5s (scroll suave até ela), para você ver exatamente onde mexeu.

Mapa de campos → onde aparece (preenchido por aba):

- **Geral**: nome → capa/H1 e card nas listagens; descrição curta → subtítulo da capa e card; duração/nível → faixa de meta-dados; marca/país/região → breadcrumbs e filtros.
- **Roteiro**: cada dia → bloco "Roteiro dia a dia".
- **Como chegar**: título/conteúdo/aeroporto/referência/observações → seção "Como chegar".
- **Mídia & narrativa**: capa → topo da página e og:image; galeria → carrossel editorial.
- **Datas & Vagas**: linhas → bloco "Próximas datas" da página e listagem `/datas`.
- **Comercial**: preço/moeda/inclui/requisitos → caixa de reserva + listas "Inclui" e "Requisitos".
- **Publicação**: status/ordem → controla se aparece publicamente; descrição SEO → `<title>`/`<meta description>` na busca do Google.

### 4. Detalhes técnicos

- Nenhuma mudança de backend, schema ou regras de negócio.
- Reaproveita o estado já controlado no `admin._authenticated.expedicoes.$id.tsx`; o preview é só uma view derivada.
- Sem nova rota — tudo dentro da tela existente.
- Animação de realce com Motion (já no projeto), respeitando `prefers-reduced-motion`.
- Sem alterações em `src/routes/expedicoes.$slug.tsx` (a página pública); o preview espelha o visual, mas vive em um componente próprio para podermos passar dados não salvos.

## Fora de escopo

- Salvar versões / histórico de rascunhos.
- Preview de outras telas (reservas, leads, etc.) — só expedições por enquanto.
- Editar diretamente clicando no preview (só leitura).

Se topar, sigo por aqui. Quer que o preview comece **fechado** (botão "Mostrar preview") ou **aberto** por padrão no desktop?
