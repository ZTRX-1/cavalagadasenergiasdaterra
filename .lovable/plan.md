## Diagnóstico do estado atual

No banco existem hoje, dentro do universo Canastra/Mantiqueira:

| Slug | Nome atual | Ativo | Duração | Carrossel |
|---|---|---|---|---|
| `serra-da-canastra` | Serra da Canastra | sim | 4d/3n | 8 imagens (são as fotos do "Entre Rédeas") |
| `rota-dos-tropeiros-da-canastra` | Rota dos Tropeiros da Canastra | **não** | 5d/4n | 8 imagens |
| `mantiqueira-5-dias` | Serra da Mantiqueira · 5 dias | sim | 4d/3n | 8 imagens |
| `mantiqueira-4-dias` | Serra da Mantiqueira · 4 dias | não | 4d/3n | 0 |
| `canastra-elas-na-sela` | Canastra · Elas na Sela | sim | 3d/2n | 8 |

Datas hoje vinculadas ao slug genérico `serra-da-canastra` (misturadas, precisam ser separadas):

- 2026-06-11 a 2026-06-14 (legado, não consta no novo plano)
- 2026-10-30 a 2026-11-02 (legado, não consta no novo plano)
- 2027-04-22, 2027-07-15, 2027-09-04, 2027-11-12 → pertencem a **Entre Rédeas**
- 2027-05-27, 2027-06-16, 2027-08-19, 2027-10-09 → pertencem a **Travessia SF**
- 2027-08-04 → pertence a **Rota dos Tropeiros**

Mantiqueira:
- `mantiqueira-5-dias` já tem `duracao = "4 dias / 3 noites"` (correto), mas o nome diz "5 dias" — inconsistência visual.
- `mantiqueira-4-dias` tem uma data órfã (2027-06-04/07) e está inativo.

Observação importante sobre o item 1 do briefing: você pede para remover **Serra da Canastra 04–07 de junho de 2026**, mas essa data não existe no banco. O que existe próximo é **11–14 de junho de 2026** (id `0b742d7e…`). Vou tratá-la como a data legada a remover (também removerei a 30-out a 02-nov 2026, que tampouco aparece no novo plano). Se alguma dessas duas deve ser preservada, me avise antes de aprovar.

## Plano de execução

### 1. Renomear `serra-da-canastra` → `entre-redeas-e-cachoeiras`
Conteúdo, roteiro e carrossel atuais já são os de Entre Rédeas — apenas renomear:
- `slug`: `entre-redeas-e-cachoeiras`
- `nome`: `Entre Rédeas e Cachoeiras`
- `subtitulo`: mantém atual

Mantém: galeria, assets, descrição, roteiro, `duracao` (4d/3n), id `c9e9f1dd…`.

### 2. Criar nova expedição `travessia-rio-sao-francisco-casca-danta`
- `nome`: Travessia do Rio São Francisco e Casca D'anta
- `subtitulo`: Mais do que uma cavalgada. Uma jornada pelas águas, paisagens e histórias da Serra da Canastra.
- `descricao_curta` + `descricao_longa`: textos do briefing item 4
- `duracao`: 5 dias / 4 noites (variável; o card de cada data pode recalcular)
- `roteiro`: 5 dias, textos integrais do briefing item 4
- `galeria`: vazia (carrossel ainda virá da equipe — estrutura pronta)
- `marca`: canastra-a-cavalo, `regiao`: Vargem Bonita, MG
- `status`: publicado, `ativo`: true

### 3. Atualizar `rota-dos-tropeiros-da-canastra`
- `ativo`: true
- `subtitulo`: Pelos caminhos que ajudaram a construir Minas Gerais
- `descricao_curta`/`descricao_longa`/`roteiro`: substituir pelos textos integrais do briefing item 5
- `duracao`: 5 dias / 4 noites
- `video_url`: NULL (não exibir bloco de vídeo)
- `nivel`: Intermediário/Avançado, máx. 10 vagas
- Mantém carrossel existente (8 imagens)

### 4. Reorganizar datas (UPDATE de `expedicao_id`)

Mover do id atual `serra-da-canastra` para os destinos corretos:
- Entre Rédeas (mesmo id, slug renomeado): 2027-04-22, 2027-07-15, 2027-09-04, 2027-11-12
- Travessia SF (id novo): 2027-05-27, 2027-06-16, 2027-08-19, 2027-10-09
- Rota dos Tropeiros: mover 2027-08-04 e DELETAR a data antiga 2026-08-15/19

Excluir datas legadas: 2026-06-11/14 e 2026-10-30/11-02 (após confirmar acima).

Ajustar `vagas_total` de cada data conforme briefing: Travessia SF e Rota dos Tropeiros = 10. Entre Rédeas mantém 10.

### 5. Mantiqueira
- Renomear `mantiqueira-5-dias` → nome "Serra da Mantiqueira" (slug mantém para não quebrar links). `duracao` já está correta (4d/3n). Datas já estão corretas (22-abr, 27-mai, 04-set 2027).
- Desativar definitivamente `mantiqueira-4-dias` e remover sua data órfã 2027-06-04/07 (duplicaria com a já existente).

### 6. Frontend
- Atualizar `src/lib/expedicao-slugs.ts` para mapear o slug antigo `serra-da-canastra` → `entre-redeas-e-cachoeiras` (redirect de canonicalização para links antigos).
- Atualizar `src/lib/expedicoes-static.ts` (fallback offline): renomear Serra da Canastra → Entre Rédeas; adicionar Travessia SF; atualizar Rota dos Tropeiros.
- Página da expedição (`src/routes/expedicoes.$slug.tsx`) já condicional a `video_url` — não exibe player se NULL. Verificar e ajustar se necessário.
- Listagens (home "Próximas Datas", `/expedicoes`, formulário de reserva) leem do banco, então refletem automaticamente após as migrações.

### 7. Validação final
Após aplicar:
- Conferir via SQL: nenhuma data 04-07/jun/2026; cada uma das 3 expedições Canastra com exatamente suas datas; Mantiqueira com 3 datas e 4d/3n; Rota dos Tropeiros ativa.
- Conferir no admin que as 3 aparecem separadas.
- Visitar cada slug público e confirmar carrossel correto, ausência de vídeo na Rota dos Tropeiros, e roteiro próprio.

## Detalhes técnicos

- 1 migration SQL fará: UPDATE expedicoes (rename + texts + ativar Tropeiros), INSERT da Travessia SF, UPDATE de `datas.expedicao_id`, DELETE das datas legadas.
- 2 edits em código: `expedicao-slugs.ts` (redirect) e `expedicoes-static.ts` (fallback).
- Nenhuma alteração de schema. Nenhum impacto em reservas (todas pertencem ao backup/zeradas).

## Pergunta antes de executar

Confirma que devo:
(a) tratar **11–14 jun 2026** como "a data de junho/2026 a remover" (já que 04-07 não existe), e
(b) também remover **30-out a 02-nov 2026** (não aparece no novo plano)?

Se sim, sigo. Se não, me diga quais datas legadas preservar.