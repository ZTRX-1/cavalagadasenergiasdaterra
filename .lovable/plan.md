
## Diagnóstico

1. **Editar não abre nada.** Os arquivos `admin._authenticated.expedicoes.tsx` (lista) e `admin._authenticated.expedicoes.$id.tsx` (editor) compartilham o segmento `/admin/expedicoes`, então o TanStack Router trata o arquivo da lista como **layout pai** do editor. Como a lista não renderiza `<Outlet />`, clicar no lápis muda a URL mas continua mostrando a lista. O mesmo afeta "Criar nova": a criação funciona no banco, navega para `/admin/expedicoes/:id`, mas o editor nunca aparece.

2. **Capas quebradas na lista.** A lista usa `getExpedicaoImage(slug)` que só conhece slugs hard-coded. Para expedições novas (slugs desconhecidos) retorna vazio → ícone de imagem quebrada. Já existe `_capa` resolvido a partir dos assets do banco, mas é usado só como fallback secundário.

3. **Preview da página pública.** O botão "Ver página pública" precisa existir tanto na lista quanto dentro do editor, e deve abrir em nova aba apontando para `/expedicoes/{slug}`.

## O que será feito

### 1. Corrigir a rota (causa raiz do "nada acontece")
Renomear `src/routes/admin._authenticated.expedicoes.tsx` → `src/routes/admin._authenticated.expedicoes.index.tsx`.

Com isso a lista vira rota irmã do editor (e não pai), eliminando o conflito de layout. Clicar no lápis passa a montar de fato o editor. Nenhuma alteração de URL pública — `/admin/expedicoes` e `/admin/expedicoes/:id` continuam funcionando.

### 2. Corrigir capas na lista
Em `admin._authenticated.expedicoes.index.tsx`, trocar a prioridade da resolução de capa para: `_capa` (banco) → `getExpedicaoImage(slug)` (hardcoded legado) → placeholder neutro com inicial da expedição. Adicionar `onError` no `<img>` para cair no placeholder se a URL do banco quebrar. Isso garante que expedições novas e antigas sempre mostrem algo.

### 3. Botão "Ver página pública"
- Na lista: adicionar ícone `ExternalLink` na coluna Ações, abrindo `/expedicoes/{slug}` em nova aba (apenas se `status === "publicado"`; senão fica desabilitado com tooltip "publique para visualizar").
- No editor: garantir que o botão já existente no header aponte corretamente para `/expedicoes/{slug}` em nova aba (verificar e ajustar se necessário).

### 4. Modal "Nova expedição" — garantir que abra editável
A criação já faz `nav({ to: "/admin/expedicoes/$id", params: { id: row.id } })` e cacheia o registro com `qc.setQueryData`. Com a correção #1 isso passa a renderizar o editor de verdade. Validar que `getExpedicao(id)` devolve a linha logo após criar (sem race com RLS) — se necessário, fazer a navegação só depois de `await qc.invalidateQueries` para evitar `notFound` momentâneo.

### 5. Polimento mínimo do editor (sem redesign)
- Mostrar o nome da expedição e o `StatusBadge` no header do editor (já importado mas não usado em todo lugar — confirmar).
- Garantir que o botão "Salvar" fique sticky/visível no topo durante scroll longo (ajuste de classe).
- Mensagem clara quando não há fotos: "Envie ao menos 1 foto na aba Mídia para definir a capa."

## Fora do escopo (mantido como está)
- Visual geral do admin (cores, tipografia, layout) — só consertos pontuais.
- Drag-and-drop de fotos/dias (continua com setas ↑↓).
- Editor rich-text para descrições.
- i18n do conteúdo editado.

## Arquivos afetados

- **Rename:** `src/routes/admin._authenticated.expedicoes.tsx` → `src/routes/admin._authenticated.expedicoes.index.tsx`
- **Edit:** o arquivo renomeado (capas + botão "ver pública" na lista)
- **Edit:** `src/routes/admin._authenticated.expedicoes.$id.tsx` (polimento de header, link de preview, mensagem de fotos)

Nenhuma alteração no banco, RLS ou no site público.
