Plano para corrigir o problema das expedições sem mexer em IA/automações/design:

1. Corrigir a causa da lista vazia no admin
- O admin está tentando buscar `expedicoes` junto com `expedicao_assets`, mas o banco não tem relacionamento formal entre essas tabelas.
- Isso gera erro 400 e impede a listagem, mesmo existindo expedições no banco.
- Vou corrigir a consulta do admin para não depender desse relacionamento quebrado e/ou criar os vínculos corretos no banco para `expedicao_assets.expedicao_id` e `datas.expedicao_id`.

2. Garantir que as 7 expedições públicas estejam no banco
- Hoje o banco já contém 7 expedições publicadas, mas a tela interna não consegue renderizar por causa do erro acima.
- Vou adicionar uma sincronização idempotente: as expedições que existem no site público ficam garantidas na tabela `expedicoes`, sem sobrescrever edições feitas no admin.
- Resultado esperado: a aba interna de Expedições mostra exatamente as expedições publicadas do site, além de rascunhos reais quando existirem.

3. Limpar os rascunhos fantasmas criados pelos cliques falhos
- Existem várias linhas `Nova expedição` em rascunho criadas por tentativas anteriores.
- Vou remover esses registros vazios de teste para não poluir o painel nem alterar contadores.

4. Corrigir “Nova expedição”
- O botão não deve apenas mostrar toast e parecer que nada aconteceu.
- Vou ajustar o fluxo para abrir diretamente uma tela de configuração da nova expedição, com campos de nome, slug, foto/mídia, descrições, datas, preço e publicação.
- Se mantivermos criação imediata de rascunho, ela será seguida obrigatoriamente por navegação confiável para a tela de edição.
- O estado de erro será visível se a criação falhar.

5. Corrigir dashboard para não divergir do site
- O KPI “Expedições ativas” será calculado com a mesma regra do site público: `ativo = true` e `status = publicado`.
- Assim, se o site tem 7 expedições publicadas, o dashboard mostra 7, não rascunhos, pausadas ou registros fantasmas.

6. Garantir sincronização site ↔ admin
- O site público continuará lendo da tabela `expedicoes` para expedições publicadas.
- O admin lerá da mesma tabela para todas as expedições, incluindo rascunhos/pausadas/arquivadas.
- Ao publicar no admin, aparece no site.
- Ao pausar/arquivar/desativar no admin, sai do site.

7. Validação final
- Verificar no banco a quantidade de expedições publicadas.
- Verificar se a lista interna carrega sem erro.
- Verificar se “Nova expedição” abre a tela de configuração.
- Verificar se o dashboard usa o mesmo número do site público.