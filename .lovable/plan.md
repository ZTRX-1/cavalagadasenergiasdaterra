Área Restrita Premium — Etapa 2/3

Construção dos módulos operacionais reais do painel. Foco em CRUD completo, publicação dinâmica no site público e experiência premium inspirada em Stripe, Linear, Notion e Framer.

IMPORTANTE:

Nesta etapa NÃO criar:

- automações;

- IA;

- WhatsApp;

- e-mails automáticos;

- gateway de pagamento;

- triggers complexas.

O foco agora é:

- estrutura operacional real;

- CRUD completo;

- estabilidade;

- escalabilidade;

- experiência premium.

==================================================

1. BANCO DE DADOS (MIGRATION ÚNICA)

==================================================

==================================================

ALTERAÇÕES EM TABELAS EXISTENTES

==================================================

expedicoes — adicionar campos faltantes:

- subtitulo (text)

- estado (text)

- cidade (text)

- vagas_total_padrao (int, default 10)

- parcelamento_max (int, default 1)

- video_url (text)

- politicas (jsonb default [])

- observacoes (text)

- tags (text[])

- status (text default 'rascunho')

  Valores:

  - rascunho

  - publicado

  - pausado

  - arquivado

- capa_url (text)

- updated_at (timestamptz + trigger)

==================================================

RLS

==================================================

- manter SELECT público apenas para:

  ativo = true

  AND status = 'publicado'

- adicionar policy ALL para:

  is_internal_user(auth.uid())

==================================================

datas — adicionar

==================================================

- updated_at + trigger

- policy ALL para is_internal_user

==================================================

leads — adicionar

==================================================

- cidade

- estado

- acompanhantes (int default 0)

- quantidade_pessoas (int default 1)

- valor_estimado (numeric)

- protocolo (text único)

- status (text default 'novo')

Valores:

- novo

- contato_realizado

- negociacao

- pagamento_pendente

- confirmado

- cancelado

- pos_venda

==================================================

participantes — adicionar

==================================================

- data_nascimento (date)

- idade (calculada via função)

- experiencia_equestre:

  - iniciante

  - intermediario

  - avancado

- restricoes (text)

- acompanhante (text)

- expedicao_id (uuid)

- data_id (uuid)

- status (text default 'pendente')

  - pendente

  - confirmado

  - cancelado

- updated_at + trigger

==================================================

reservas — adicionar

==================================================

- valor_total (numeric)

- valor_pago (numeric default 0)

- forma_pagamento:

  - pix

  - cartao

  - transferencia

  - outro

- parcelas (int default 1)

- status_pagamento:

  - pendente

  - parcial

  - confirmado

- updated_at + trigger

Policy:

- ALL para is_internal_user

==================================================

NOVAS TABELAS

==================================================

==================================================

lead_atividades

==================================================

Timeline operacional do lead:

Campos:

- lead_id

- tipo:

  - criacao

  - mudanca_status

  - observacao

  - contato

- descricao

- autor_id

- created_at

RLS:

- ALL para is_internal_user

==================================================

activity_logs

==================================================

Logs operacionais globais.

Campos:

- id

- usuario

- acao

- modulo

- descricao

- created_at

Objetivo:

Registrar ações importantes do sistema.

Exemplos:

- expedição criada

- expedição alterada

- lead convertido

- status alterado

- pagamento atualizado

IMPORTANTE:

Preparar desde agora estrutura de auditoria e rastreabilidade operacional.

==================================================

protocolo_lead_counter

==================================================

Estrutura de contador para protocolos automáticos.

==================================================

expedicao_assets

==================================================

Organização de mídia.

Campos:

- id

- expedicao_id

- tipo:

  - imagem

  - video

  - pdf

- url

- titulo

- ordem

- is_capa

==================================================

IMPORTANTE

==================================================

Migrar automaticamente:

- expedicoes.galeria

- expedicao-images.ts

para esta tabela.

==================================================

RLS

==================================================

SELECT público:

- apenas quando expedição estiver publicada.

ALL:

- apenas para is_internal_user

==================================================

USUÁRIOS / ROLES

==================================================

Adicionar campo:

role (text)

Valores futuros:

- admin

- financeiro

- operador

- midia

IMPORTANTE:

Mesmo sem implementar permissões avançadas agora, deixar estrutura preparada para expansão futura.

==================================================

STORAGE BUCKETS

==================================================

==================================================

expedicao-midia

==================================================

Bucket público para:

- imagens

- assets

- capas

==================================================

IMPORTANTE SOBRE VÍDEOS

==================================================

NÃO realizar upload direto de vídeos nesta etapa.

Utilizar apenas:

- YouTube embed

- Vimeo embed

- URLs externas

Objetivo:

- evitar peso excessivo

- evitar custos de storage

- evitar problemas de performance

==================================================

expedicao-docs

==================================================

Bucket privado:

- PDFs

- políticas

- roteiros

==================================================

participante-docs

==================================================

Bucket privado:

- documentos

- uploads internos

==================================================

POLICIES

==================================================

Públicos:

- SELECT livre

- INSERT/UPDATE/DELETE apenas:

  is_internal_user

Privados:

- tudo apenas:

  is_internal_user

==================================================

2. SERVER FUNCTIONS

==================================================

Toda escrita do painel deve passar por:

- createServerFn

- requireSupabaseAuth

==================================================

ARQUIVOS

==================================================

src/lib/admin/expedicoes.functions.ts

- list

- get

- create

- update

- duplicate

- archive

- publish

- delete

- reorder-assets

- set-capa

- upload-asset

- delete-asset

==================================================

IMPORTANTE

==================================================

Utilizar sistema simples e estável de organização de mídia:

- mover para cima

- mover para baixo

- definir capa principal

- remover mídia

NÃO implementar drag-and-drop avançado nesta etapa.

Priorizar:

- estabilidade

- responsividade

- simplicidade operacional

==================================================

src/lib/admin/datas.functions.ts

==================================================

- list

- create

- update

- delete

==================================================

src/lib/admin/leads.functions.ts

==================================================

- list

- get

- create

- update

- change-status

- add-note

- delete

==================================================

src/lib/admin/participantes.functions.ts

==================================================

- CRUD completo

- vínculo reserva/expedição

==================================================

src/lib/admin/financeiro.functions.ts

==================================================

- list reservas

- filtros

- update-pagamento

- agregações dashboard

==================================================

VALIDAÇÃO

==================================================

Usar Zod em tudo.

==================================================

IMPORTANTE

==================================================

Toda alteração relevante deve gerar:

- lead_atividades

- activity_logs

==================================================

3. MÓDULO EXPEDIÇÕES

==================================================

Rota:

- /admin/expedicoes

==================================================

LISTA

==================================================

Tabela premium contendo:

- capa

- nome

- marca

- status

- vagas

- próxima data

- valor

- ações

==================================================

FILTROS

==================================================

- status

- marca

- busca

==================================================

AÇÕES

==================================================

- editar

- duplicar

- publicar

- pausar

- arquivar

- excluir

==================================================

FORMULÁRIO

==================================================

Layout:

- duas colunas

- formulário principal

- preview lateral compacto

==================================================

ABAS

==================================================

==================================================

GERAL

==================================================

- nome

- subtitulo

- slug automático

- marca

- descrição

- país

- estado

- cidade

- região

- dificuldade

- duração

- tags

- observações

==================================================

MÍDIA

==================================================

- upload de imagens

- preview

- capa principal

- reorganização simples

- remover mídia

- video_url externa

==================================================

DATAS & VAGAS

==================================================

- datas editáveis

- vagas

- preço pix

- preço cartão

- status

- add/remove inline

==================================================

COMERCIAL

==================================================

- preço

- parcelamento

- requisitos

- inclui

- roteiro

==================================================

DOCUMENTOS

==================================================

Upload:

- PDFs

- políticas

- roteiros

==================================================

PUBLICAÇÃO

==================================================

- status

- ativo toggle

- ordem

==================================================

SALVAMENTO

==================================================

- botão “Salvar rascunho”

- botão “Salvar e publicar”

IMPORTANTE:

NÃO utilizar auto-save nesta etapa.

==================================================

PUBLICAÇÃO DINÂMICA

==================================================

Refatorar:

- expedicoes-static.ts

para:

- expedicoes-public.functions.ts

==================================================

IMPORTANTE

==================================================

O site público deve:

- ler prioritariamente do banco

- mas manter fallback seguro local/estático

Objetivo:

Garantir estabilidade caso:

- banco falhe

- painel falhe

- deploy falhe

==================================================

SEED INICIAL

==================================================

Migrar automaticamente:

- expedicoes-static.ts

- expedicao-images.ts

para o banco.

==================================================

4. MÓDULO LEADS

==================================================

Rota:

- /admin/leads

==================================================

PIPELINE KANBAN

==================================================

7 colunas:

- novo

- contato realizado

- negociação

- pagamento pendente

- confirmado

- cancelado

- pós-venda

==================================================

CARD

==================================================

- nome

- expedição

- valor estimado

- dias desde criação

- badge origem

==================================================

TOOLBAR

==================================================

- busca

- filtros

- kanban/tabela

==================================================

DETALHE

==================================================

Layout split:

- dados esquerda

- timeline direita

==================================================

FUNÇÕES

==================================================

- editar inline

- mudar status

- adicionar nota

- converter reserva

==================================================

5. MÓDULO PARTICIPANTES

==================================================

Rota:

- /admin/participantes

==================================================

LISTA

==================================================

- filtros

- expedição

- data

- status

- idade calculada

==================================================

DETALHE

==================================================

- formulário completo

- upload docs

- vínculo reserva

==================================================

6. MÓDULO FINANCEIRO

==================================================

Rota:

- /admin/financeiro

==================================================

KPIs

==================================================

- faturamento confirmado

- faturamento estimado

- pendente

- expedições top

==================================================

GRÁFICO

==================================================

- faturamento confirmado

- estimado

- últimos 6 meses

==================================================

TABELAS

==================================================

- pagamentos pendentes

- expedições mais lucrativas

==================================================

DETALHE RESERVA

==================================================

- protocolo

- expedição

- responsável

- pagamento

- histórico

==================================================

7. DESIGN SYSTEM PREMIUM

==================================================

Adicionar:

- status badges

- tabelas premium

- cards

- glow discreto

- glassmorphism

- loading skeleton

- microinterações suaves

==================================================

COMPONENTES

==================================================

- admin-data-table

- admin-status-badge

- admin-confirm-dialog

- admin-asset-uploader

- admin-form-section

- admin-empty-state

- admin-kanban-board

- admin-timeline

==================================================

UX

==================================================

- toast sonner

- optimistic updates

- fade-in suave

- loading elegante

==================================================

8. DEPENDÊNCIAS

==================================================

- react-dropzone

- date-fns

- recharts

IMPORTANTE:

NÃO adicionar:

- @dnd-kit

nesta etapa.

==================================================

9. RESPONSIVIDADE

==================================================

==================================================

DESKTOP

==================================================

- sidebar 240px

==================================================

NOTEBOOK

==================================================

- sidebar compacta

==================================================

TABLET

==================================================

- drawer

- cards responsivos

==================================================

MOBILE

==================================================

- stacked cards

- abas full-width

- drawer responsivo

==================================================

10. FORA DE ESCOPO (ETAPA 3)

==================================================

- automações

- IA

- WhatsApp

- e-mails automáticos

- gateway pagamento

- triggers

- relatórios avançados

==================================================

ORDEM DE EXECUÇÃO

==================================================

1. migration única

2. buckets

3. server functions

4. leitura pública

5. componentes admin

6. módulo expedições

7. módulo leads

8. módulo participantes

9. módulo financeiro

10. responsividade

11. polimento final

==================================================

IMPORTANTE FINAL

==================================================

Todo o sistema precisa parecer:

- premium

- sofisticado

- tecnológico

- moderno

- extremamente organizado

SEM aparência:

- ERP antigo

- painel genérico

- sistema ultrapassado

- builder improvisado