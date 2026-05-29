## O problema

As 8 expedições publicadas mostram no site:
- **1 foto de capa** (no topo da página) — vinda de `SLUG_IMAGE` em `src/lib/expedicao-images.ts`.
- **8 fotos do carrossel narrativo** com legenda emocional cada — vindas de `SLUG_NARRATIVA` no mesmo arquivo.

Mas no banco (`expedicoes.capa_url` + `expedicao_assets`) **todas as 8 expedições têm 0 fotos e nenhuma capa**. Por isso o painel aparece vazio — o site renderiza direto do código (curadoria estática), não do banco.

A cliente precisa enxergar essas mesmas fotos e legendas no admin para poder editar.

## A solução

**Migrar a curadoria estática para o banco**, uma única vez, e a partir daí o site continua mostrando as mesmas imagens (a função `getExpedicaoImage`/`getExpedicaoGaleria`/`getExpedicaoNarrativa` já prioriza assets do banco sobre a curadoria estática — só faltava o banco ter os dados).

### Passo 1 — Script de seed (rodado uma vez)

Criar `scripts/seed-expedicao-assets.ts` que:

1. Para cada slug em `SLUG_NARRATIVA` (8 expedições):
   - Lê os 8 arquivos `.jpg` correspondentes em `src/assets/fotos/<pasta>/`.
   - Faz upload para o bucket público `expedicao-midia` em `<slug>/01.jpg` … `<slug>/08.jpg` usando `supabaseAdmin` (service role).
   - Insere 8 linhas em `expedicao_assets` com:
     - `expedicao_id` (lookup pelo slug)
     - `tipo = 'imagem'`
     - `url` = URL pública do bucket
     - `titulo` = legenda da `CenaNarrativa`
     - `ordem` = 1..8
     - `is_capa = true` apenas para a primeira (que já é a capa em `SLUG_IMAGE`)
   - Atualiza `expedicoes.capa_url` com a URL pública da foto 01.

2. **Idempotente**: antes de inserir, deleta assets existentes para aquele `expedicao_id` (`DELETE FROM expedicao_assets WHERE expedicao_id = …`) e reescreve. Assim podemos rodar de novo se algo der errado.

3. Roda via `code--exec` com `bun run scripts/seed-expedicao-assets.ts`. Usa variáveis `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` já presentes no ambiente.

Depois de rodar, o admin passa a mostrar exatamente as 8 fotos com as legendas que aparecem no site, e a capa fica preenchida.

### Passo 2 — Pequeno ajuste no editor (aba Geral)

Na seção "Capa editável", quando `capa_url` está vazia **mas existe um asset com `is_capa = true`**, usar esse asset como preview (em vez de mostrar área pontilhada vazia). Isso garante que após o seed a capa apareça corretamente mesmo se `expedicoes.capa_url` por algum motivo não foi populado.

Pequena melhoria no helper que monta o preview, sem mudar comportamento de upload.

### Passo 3 — Texto explicativo no admin

Adicionar uma nota discreta no topo da aba "Mídia & narrativa":
> "Estas são as fotos exibidas no carrossel da página pública. A primeira é também a capa que aparece no topo da página e no card de listagem. Você pode reordenar, trocar legenda ou substituir qualquer foto."

Assim a cliente entende a relação 1:1 entre o que ela edita aqui e o que o público vê.

## O que NÃO muda

- A curadoria estática em `src/lib/expedicao-images.ts` continua intacta como **fallback** (se um dia o banco zerar, o site não quebra).
- Schema do banco: nada muda. Tabelas `expedicoes` e `expedicao_assets` já têm todas as colunas necessárias (`capa_url`, `titulo`, `ordem`, `is_capa`).
- RLS, server functions, site público: nenhum impacto. A página `expedicoes.$slug.tsx` já lê assets do banco com fallback estático.
- Layout/visual do editor: igual ao da última iteração aprovada.

## Arquivos afetados

- **Novo:** `scripts/seed-expedicao-assets.ts` — seed único (rodado via exec).
- **Edit:** `src/routes/admin._authenticated.expedicoes.$id.tsx` — preview da capa lê de `is_capa` quando `capa_url` está vazio; nota explicativa na aba Mídia.

## Risco / rollback

- O script é idempotente e rodado só nos 8 slugs conhecidos. Se quiser desfazer: `DELETE FROM expedicao_assets WHERE expedicao_id IN (…)` + `UPDATE expedicoes SET capa_url = NULL`. O site volta a renderizar pela curadoria estática automaticamente.
