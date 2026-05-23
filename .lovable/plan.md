## Plano — Substituição das imagens IA pelas fotos reais

Recebi **35 fotos reais** no total (1–30 + variantes 21-2…25-2 + Eqp da equipe). Abaixo o plano cirúrgico para integrá-las sem refatorar nada.

---

### 1. Salvar e organizar as fotos

Copiar todas as fotos de `user-uploads://` para `src/assets/fotos/` com nomes semânticos (não numéricos), por exemplo:
- `cavaleira-rio-sunset.jpg` (21)
- `cavaleira-chapeu-laranja-rio.jpg` (22)
- `cavalo-baia-porta-verde.jpg` (23)
- `cavaleira-laranja-respingo.jpg` (24)
- `almoco-trilha-rio.jpg` (25)
- `cachoeira-aerea-canastra.jpg` (26)
- `cavaleira-eucaliptal.jpg` (27)
- `comitiva-aerea-rio.jpg` (28)
- `dupla-campo-cerrado.jpg` (29)
- `grupo-varanda-pousada.jpg` (30)
- `equipe-mangalarga.jpg` (Eqp)
- …e assim por diante para as fotos 1–20

Total: ~31 arquivos únicos em `src/assets/fotos/` (variantes 21-2…25-2 são duplicatas — descarto).

### 2. Mapear cada foto → slot atual no projeto

Vou fazer uma curadoria cirúrgica substituindo as imagens IA atuais em **`src/lib/expedicao-images.ts`** (mapa central) e em pontos pontuais (hero, sobre, marcas):

| Slot atual (IA) | Foto real proposta |
|---|---|
| `hero-cavalgada` (home hero) | `cavaleira-rio-sunset.jpg` (21) — luz dourada cinematográfica |
| `expedicao-canastra` | `cachoeira-aerea-canastra.jpg` (26) |
| `expedicao-cipo` / Berço do Marchador | `cavaleira-eucaliptal.jpg` (27) |
| `expedicao-chapada` / Peru | foto de paisagem aberta adequada (1–20) |
| `expedicao-aerea` / Jericoacoara | `comitiva-aerea-rio.jpg` (28) |
| `cavalo-closeup` | `cavalo-baia-porta-verde.jpg` (23) |
| `acampamento` | `almoco-trilha-rio.jpg` (25) |
| Marca **Cavalgadas** | `dupla-campo-cerrado.jpg` (29) + `grupo-varanda-pousada.jpg` (30) |
| Marca **Elas na Sela** | `cavaleira-chapeu-laranja-rio.jpg` (22) + `cavaleira-laranja-respingo.jpg` (24) |
| Marca **Canastra a Cavalo** | `cachoeira-aerea-canastra.jpg` (26) + fotos 1–20 da Canastra |
| Seção equipe / sobre | `equipe-mangalarga.jpg` (Eqp) |

### 3. Aplicar substituições (somente imports e mapa)

- Atualizar `src/lib/expedicao-images.ts` apontando para os novos arquivos.
- Atualizar `src/routes/index.tsx` (hero + galerias) trocando imports IA pelos reais.
- Atualizar `src/routes/marcas.*.tsx` (3 páginas) com as fotos da respectiva marca.
- **Não** mexer em componentes/layout/estilos — só os caminhos das imagens.

### 4. Limpeza opcional

Após confirmação visual, marcar as antigas imagens IA (`hero-cavalgada.jpg`, `expedicao-*.jpg`, etc.) como obsoletas. Posso deletá-las ao final ou manter como fallback — me diga sua preferência.

---

### Pergunta antes de implementar

Antes que eu comece, **quer que eu primeiro analise visualmente as fotos 1–20** (ainda não me pronunciei sobre elas em detalhe) e proponha o mapeamento final completo para você aprovar, ou posso já executar o plano confiando na minha curadoria?