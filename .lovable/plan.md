
## O que será ajustado no editor de expedição

### 1. Preview com capa editável (aba Geral, coluna direita)

Hoje o "Preview" só mostra a imagem (ou um placeholder seco quando não há capa). Vamos transformá-lo em **capa editável** ali mesmo, sem precisar ir até a aba Mídia:

- Quando **já existe capa**: mostra a imagem com um botão flutuante "Trocar capa" no canto + um botão discreto "Remover capa".
- Quando **não há capa**: área pontilhada com texto claro "Clique para enviar a capa (JPG, PNG ou WebP)". Aceita clique e drag-and-drop.
- O upload usa o mesmo `uploadAsset` da aba Mídia e marca automaticamente como `is_capa`. A foto também passa a fazer parte do carrossel (mesmo padrão atual), evitando duplicidade.
- Texto auxiliar abaixo: "Esta imagem aparece no card de listagem e no topo da página pública."

Resolve o relato "não sei porque tá aparecendo como se a imagem não tivesse ali".

### 2. Carrossel de fotos mais intuitivo (aba Mídia & narrativa)

A estrutura atual já permite enviar, reordenar, marcar capa e legendar. Vamos tornar o fluxo dos **8 slots padrão** explícito e mais fácil:

- Cabeçalho da seção mostra contador: **"Foto X de 8"** (verde quando ≥ 8, âmbar abaixo). Texto explicativo: "O padrão das expedições é um carrossel de 8 fotos com uma legenda emocional em cada uma. Você pode ter mais ou menos."
- Dropzone com cópia mais clara: "Arraste até 8 fotos de uma vez ou clique para escolher".
- Cada cartão de foto ganha:
  - Etiquetas visíveis nos botões de ação (não só ícone): **Subir / Descer / Definir capa / Remover** (no desktop com texto pequeno; no mobile vira menu de ações).
  - Campo de legenda com placeholder novo: "Ex.: 'O primeiro passo antes da travessia.'" e contador "0/140" — só visual, sem cortar.
  - Cabeçalho do cartão mostra "Foto N — Capa" ou "Foto N" para deixar claro a ordem do carrossel.
- Quando há 0 fotos: bloco de "primeiros passos" com botão grande "Enviar primeira foto" + dica "A primeira foto enviada vira automaticamente a capa".

### 3. Aba "Datas & Vagas" com legendas e layout responsivo

Hoje a linha é `grid-cols-12` com 6 campos numéricos sem rótulo — daí o "número 8, 3200, 3520" que a cliente não entende. E em mobile a linha estoura.

- Adicionar **cabeçalho de colunas** uma única vez no topo da tabela (desktop): `Início · Fim · Vagas total · Vagas disponíveis · Preço Pix (R$) · Preço cartão (R$) · Ações`.
- Cada linha vira um **cartão**:
  - **Desktop (≥ md):** mantém layout em grid, mas com rótulo curto acima de cada input (`text-[10px] uppercase tracking-wider text-muted`).
  - **Mobile (< md):** empilha em 2 colunas (datas lado a lado; vagas lado a lado; preços lado a lado), botão "Remover" full-width no rodapé. Sem overflow horizontal.
- Tooltip de ajuda no título da seção: ícone "?" com explicação curta — "Vagas total é o limite da turma. Vagas disponíveis é quanto ainda pode ser vendido. Pix e Cartão são os preços que aparecem no site."
- Botão "Adicionar data" abre a nova linha já com datas = hoje, vagas = padrão da expedição e preços herdando o `preco` geral (em vez de vir vazio).
- Validação leve: se `vagas_disponiveis > vagas_total`, mostrar aviso âmbar inline ("Vagas disponíveis não pode passar do total").

### 4. Responsividade geral do editor

Varredura no arquivo para corrigir overflow em telas pequenas:

- **Header de ações** (`flex-wrap` já existe — manter, mas garantir `gap-2` consistente e botões com `text-xs` em < sm).
- **Tabs**: `TabsList` já tem `flex-wrap h-auto`. Adicionar `gap-1` para não cortar texto em iPhone SE.
- **Aba Geral**: grid `lg:grid-cols-3` mantida; em mobile a coluna do Preview vira primeira (`order-first lg:order-none`) — assim a cliente vê o resultado antes de rolar tudo.
- **Aba Mídia**: cartões `md:grid-cols-[140px_1fr_auto]` viram coluna única em mobile com a foto em cima, legenda no meio e ações empilhadas — sem botões cortados.
- **Aba Comercial**: `grid-cols-3` vira `grid-cols-2 sm:grid-cols-3` para não amassar inputs em < sm.

### Fora de escopo

- Redesign visual geral do admin (mantém o padrão atual).
- Drag-and-drop para reordenar fotos (continua com setas ↑↓).
- Mudanças no site público.
- Mudanças de schema do banco (todas as colunas necessárias já existem).

### Arquivos afetados

- **Edit:** `src/routes/admin._authenticated.expedicoes.$id.tsx` — Preview editável, melhorias do carrossel, legendas/responsividade da aba Datas, ajustes responsivos gerais.

Sem alterações em banco, RLS, server functions ou site público.
