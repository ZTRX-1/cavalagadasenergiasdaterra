## Plano de refinamento final

### Material recebido agora
- `Patagonia.rar` — 3 fotos
- `Peru.rar` — 12 fotos
- `Serra da Canastra.rar` — 38 fotos + 1 da Equipe + 1 IMG_0165
- `Serra da Mantiqueira.rar` — 34 fotos

Total: ~88 fotos reais oficiais, uma pasta por destino.

### Dependência aberta — PDFs
Os PDFs **não foram reanexados** neste envio. Preciso deles para fazer a revisão pedida (datas, valores, parcelamento, regras, inclusos). **Por favor reanexe os PDFs oficiais de cada expedição** no próximo envio — sem eles, eu só consigo manter os dados que já estão no banco (que vieram dos PDFs anteriores).

Posso seguir já com fotos e copy enquanto você reanexa os PDFs.

---

### Etapa 1 — Curadoria e import das fotos (sem PDFs)

1. **Conversão e otimização**
   - Converter todas as `.jfif` para `.jpg` otimizadas (qualidade 82, redimensionadas para máx 2000px lado maior).
   - Salvar em `src/assets/fotos/{destino}/NN-descritor.jpg` para nomes semânticos.

2. **Curadoria visual por destino** (eu mesmo seleciono as melhores, descarto duplicatas/fracas):
   - **Canastra**: hero panorâmico (drone cachoeira), card capa, 8–10 fotos de galeria (travessia, cavalo, gastronomia, pôr-do-sol, hospedagem, pessoas reais).
   - **Mantiqueira (Berço do Marchador / Cruzilia)**: mesmo padrão.
   - **Peru (Vale do Colca)**: hero, card, galeria (12 fotos disponíveis — uso todas as boas).
   - **Patagônia**: 3 fotos — 1 hero, 1 card, 1 galeria/atmosfera.

3. **Mapeamento de slots no site** (sem repetir excessivamente):
   - Hero home (`/`): rotaciona 2–3 das melhores cinematográficas (Canastra drone, Mantiqueira pôr-do-sol).
   - Card da expedição em listagem: 1 foto-capa única por expedição.
   - Página de detalhe (`/expedicoes/$slug`): hero próprio + galeria editorial.
   - Páginas de marca (Cavalgadas, Elas na Sela, Canastra a Cavalo): fotos coerentes com identidade.
   - Quem somos / equipe: `Eqp.jfif` no bloco de equipe.

4. **Limpeza**: remover/marcar como obsoletas as imagens IA antigas (`expedicao-canastra.jpg`, `expedicao-cipo.jpg`, etc).

### Etapa 2 — Galerias premium (editorial, não grid)

Criar componente `<GaleriaEditorial />` com:
- Layout asymmetric/bento (alterna 1 foto grande + 2 pequenas, foto full-bleed entre blocos).
- Lazy-loading nativo (`loading="lazy"`, `decoding="async"`).
- Aspect-ratio fixo (sem CLS), blur placeholder via gradiente do token `--carvao`.
- Lightbox sutil ao clique (Dialog do shadcn já disponível).
- Ritmo: espaçamento generoso (`gap-6 md:gap-10`), sem encher tela de imagem.

Aplicado em: detalhe de expedição, página da marca, seção "Atmosfera" no home.

### Etapa 3 — Refino de copy (anti-hífen)

Auditar com `rg " — | - "` em `src/routes/` e `src/components/` e em strings de banco (descrições de expedição). Substituir traços excessivos por vírgulas, pontos ou ritmo natural. Lista de candidatos típicos:
- Subtítulos do hero
- Cards de expedição
- Páginas de marca (manifestos)
- Footer / chamadas

Critério: máximo 1 travessão por parágrafo, preferindo prosa fluida.

### Etapa 4 — Performance

- Conversão `.jpg` com qualidade 82 e largura máx 2000px no script de import.
- `loading="lazy"` e `decoding="async"` em toda foto que não seja hero LCP.
- Hero LCP com `fetchpriority="high"` e `<link rel="preload">` via `head()` da rota.
- Aspect-ratio reservado em todo `<img>` para zero CLS.

### Etapa 5 — Revisão dos PDFs (após você reanexar)

Quando os PDFs voltarem, vou:
1. Parse de cada PDF (`document--parse_document`).
2. Comparar campo a campo com a tabela `expedicoes` e `datas` no banco: nome, preço, moeda, duração, datas, vagas, inclusos, requisitos, roteiro.
3. Gerar migrations `UPDATE` para cada divergência (PDF vence).
4. Conferir copy do site (páginas de marca, manifestos) contra os PDFs institucionais.

---

### Ordem de execução
1. Etapa 1 + 2 + 3 + 4 — já posso fazer agora.
2. Etapa 5 — quando você reanexar os PDFs.

### Confirmação que preciso
- **OK em seguir com fotos/galerias/copy/perf agora e tratar PDFs num segundo turno?**
- Caso já queira reanexar os PDFs neste momento, só mandar.
