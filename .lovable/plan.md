## Diagnóstico

O painel admin **já tem** um editor de expedições em `/admin/expedicoes` e `/admin/expedicoes/:id` com abas Geral, Mídia, Datas & Vagas, Comercial, Publicação. Ele já permite criar, duplicar, arquivar, publicar e editar a maioria dos campos. O que falta para a dona conseguir gerenciar tudo sozinha:

1. **Roteiro dia-a-dia não é editável** pela interface (o campo existe no banco como `roteiro` jsonb, mas a aba não existe no editor).
2. **A narrativa visual (carrossel com legendas emocionais)** de cada expedição está **codada à mão** em `src/lib/expedicao-images.ts`. A cliente não consegue trocar fotos, reordenar nem editar legendas sem programador.
3. **Galeria editorial e imagem de capa** também caem no fallback hardcoded de `expedicao-images.ts` quando o banco não tem assets — então hoje, mesmo subindo foto pela aba Mídia, ela não aparece na página pública porque a página lê do arquivo estático.
4. **Legendas por foto** não existem na aba Mídia (o campo `titulo` em `expedicao_assets` está ocioso).
5. **Card da lista pública** (`/expedicoes`) também usa o mapeamento hardcoded em vez da capa salva no banco.

Resultado: hoje a cliente consegue editar nome/preço/inclui/datas, mas **não consegue trocar fotos, legendas nem roteiro** sem mexer em código.

## O que vamos construir

### 1. Nova aba "Roteiro" no editor da expedição
Em `/admin/expedicoes/:id`, adicionar aba **Roteiro** entre "Geral" e "Mídia". Interface minimalista:
- Lista de dias arrastáveis (Dia 1, Dia 2, …)
- Cada dia: campo título + campo descrição (textarea)
- Botões: **+ Adicionar dia**, subir, descer, remover
- Salva no campo `roteiro` jsonb que já existe na tabela `expedicoes`

### 2. Mídia com legendas e narrativa editorial
Reformular a aba **Mídia** para virar o "carrossel narrativo" editável:
- Cada foto enviada ganha campo **legenda** (texto emocional que aparece sob a foto na página pública) — usa o campo `titulo` já existente em `expedicao_assets`.
- Reordenação por setas (já existe) + indicador visual de ordem.
- Marcar capa (já existe).
- Bloco separado dentro da aba para "Imagem de capa alternativa" (opcional, URL externa) — já existe via `capa_url`.

### 3. Página pública lê do banco
Rewire as 3 funções de `src/lib/expedicao-images.ts` para, **quando a expedição tiver assets no banco, usar eles**:
- `getExpedicaoImage(slug)` → capa do banco (asset `is_capa=true` ou `capa_url`), fallback estático só se não houver nada.
- `getExpedicaoGaleria(slug)` → todos os assets `tipo='imagem'` ordenados.
- `getExpedicaoNarrativa(slug)` → assets com `titulo` preenchido viram cenas narrativas (foto + legenda).

Isso significa: quando a cliente subir fotos novas pelo admin, **elas substituem automaticamente** as hardcoded na página pública. As atuais continuam funcionando como fallback enquanto ninguém editar.

### 4. Polimento do editor para uso pela dona
- Indicador visual no topo de **"o que falta para publicar"** (ex.: "Adicione pelo menos 1 foto", "Defina o preço", "Escreva a descrição curta") com checklist.
- Botão **"Visualizar página pública"** já existe — mover para o header em destaque.
- Tooltip/hint discreto em campos críticos (slug, capa).
- Ajustar o botão "Nova expedição" para abrir um pequeno modal com **nome + marca + país** antes de criar, evitando expedições "Nova expedição" vazias na lista.

### 5. Lista pública e cards
- `/expedicoes` (lista) e `expedicao-card.tsx` passam a usar `capa_url` ou primeiro asset, não o mapeamento hardcoded por slug.

## Detalhes técnicos

```text
Arquivos modificados:
  src/routes/admin._authenticated.expedicoes.$id.tsx   ← +aba Roteiro, +legenda nos assets, +checklist publicação
  src/routes/admin._authenticated.expedicoes.tsx       ← modal "criar nova" com nome/marca/país
  src/lib/admin/api.ts                                  ← updateAsset({ titulo }) (adicionar se faltar)
  src/lib/expedicao-images.ts                          ← funções viram async/aceitam assets do banco
  src/lib/expedicoes.functions.ts                      ← getExpedicaoBySlug retorna também `assets`
  src/routes/expedicoes.$slug.tsx                      ← consome assets do banco; fallback estático
  src/routes/expedicoes.tsx + src/components/expedicao-card.tsx ← capa via DB

Tabelas (sem migration — schema já comporta):
  expedicoes.roteiro (jsonb) — já usado, só falta UI
  expedicao_assets.titulo (text) — vira "legenda"
  expedicao_assets.ordem / is_capa — já usados
```

Sem mudanças de schema, sem nova migration. Mantém o fallback estático para não quebrar nada enquanto a cliente ainda não editou.

## Estética da interface admin

Manter o design tecnológico/minimalista já em uso (tokens `--admin-*`, cards escuros, dourado discreto). Sem ícones extras desnecessários. Tudo dentro do mesmo padrão das outras abas do painel.

## Fora de escopo

- Drag-and-drop "de verdade" (HTML5 DnD) para reordenar — vamos com setas ↑↓ que já são o padrão da Mídia atual. Posso adicionar DnD depois se a cliente pedir.
- Internacionalização do conteúdo editado (PT/EN/ES por expedição) — campos hoje são single-language; entrar nisso dobra a UI e exige decisão de produto separada.
- Editor rich-text (negrito/itálico) — descrições continuam em texto simples, como hoje.
