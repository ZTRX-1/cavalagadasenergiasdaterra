# Plano de refatoração do painel admin

Várias correções estruturais e de UX a serem feitas em sequência. Foco em funcionalidade real e integração com o site público.

## 1. Expedições — capa, CRUD e publicação

**Problema:** miniaturas sem capa, botões editar/publicar/arquivar inertes, "Nova expedição" cria rascunho mas não abre edição.

- Listar miniaturas usando `capa_url` → fallback `imagem_url` → fallback primeira imagem em `expedicao_assets` (já existe FK). Adicionar placeholder elegante caso nenhuma exista.
- Botão lápis (editar): navegar para `/admin/expedicoes/$id`.
- Botão publicar: `update expedicoes set status='publicado', ativo=true`.
- Botão pausar: `status='pausado', ativo=false` → some do site (RLS público já filtra `ativo=true AND status='publicado'`).
- Botão arquivar: `status='arquivado', ativo=false`.
- Confirmar que tela de detalhe `/admin/expedicoes/$id` permite editar nome, slug, descrições, preço, duração, nível, capa (upload), galeria, datas, status. Auditar campos faltantes.
- Garantir que ao publicar, a expedição aparece imediatamente no site (mesma tabela, mesma RLS — já está).

## 2. Mídia — esclarecer escopo

**Problema:** usuário não entende para onde vai a mídia.

- Adicionar header explicativo: "Galeria geral da empresa (não vinculada a expedição específica). Para fotos de uma expedição, use a aba Mídia dentro da página de cada expedição."
- Filtro por expedição (dropdown) para visualizar mídia já vinculada a uma expedição específica.
- Mostrar badge "Expedição X" ou "Geral" em cada item.

## 3. Documentos — filtros profissionais

**Problema:** falta organização para documentos de participantes/contratos.

- Tabela já tem: `escopo` (institucional/expedicao/participante), `categoria`, `participante_id`, `reserva_id`, `expedicao_id`.
- Na aba "Participantes":
  - Colunas: Participante | Reserva (protocolo) | Expedição | Tipo de documento | Categoria | Data | Ações
  - Filtros: por expedição, por categoria (contrato, RG, termo de responsabilidade, atestado médico, comprovante de pagamento, outros), por participante (busca), por período.
  - Upload: selecionar participante (autocomplete vindo de `participantes` + `reservas`) → tipo → arquivo.
- Tipos padronizados: contrato, termo_responsabilidade, rg_cpf, atestado_medico, comprovante_pagamento, seguro_viagem, outros.

## 4. Configurações — usuários internos sem convite

**Problema:** atual instrução pede convite por e-mail; usuário quer cadastro direto pelo admin.

- Criar server function `criarUsuarioInterno` usando `supabaseAdmin.auth.admin.createUser` (email_confirm=true, senha temporária).
- Form no admin: nome, e-mail, cargo, função (admin/operador/financeiro/guia/marketing), senha inicial.
- Após criar: insert em `user_roles` com role escolhida + atualizar `profiles.cargo`.
- Listar usuários internos (join `profiles` + `user_roles`) com ações: editar cargo, desativar, redefinir senha.
- Cargos pré-definidos do ramo: Administrador, Gerente Operacional, Coordenador de Expedições, Guia de Campo, Financeiro, Marketing/Comunicação, Atendimento/Reservas, Suporte.

## 5. Perfil pessoal de usuário

**Problema:** não há perfil pessoal para cada funcionário.

- Adicionar colunas em `profiles`: `bio` (text), `telefone` (text). `avatar_url` já existe.
- Criar bucket `avatars` (público, limite 2 MB por arquivo, apenas imagens jpg/png/webp).
- Rota `/admin/perfil`: edita nome, cargo, bio, telefone, avatar (upload com validação client-side de tipo e tamanho).
- Topbar mostra avatar circular + nome → menu → "Meu perfil" / "Sair".

## 6. Logo oficial

- Substituir placeholder por logo real (já disponível em `configuracoes.logo_url` ou asset do site).
- Aplicar em: tela de login do admin, sidebar do admin, header público (já tem).

## 7. Correções visuais (sobreposição texto/ícone/card)

- Auditar `admin-sidebar`, `admin-topbar`, cards de KPI do dashboard, lista de expedições, formulários.
- Garantir `truncate`, `gap` adequado entre ícone e texto, `overflow-hidden` em cards, padding consistente.
- Refinar tipografia hierárquica (titles, subtitles, captions).

## Ordem de execução

1. Migration: bucket `avatars` + colunas `profiles.bio`, `profiles.telefone`.
2. Lista de expedições: capa com fallback, ações funcionais (editar/publicar/pausar/arquivar).
3. Auditoria/correção da tela de detalhe de expedição.
4. Aba Mídia: header explicativo + filtro por expedição.
5. Aba Documentos/Participantes: filtros e tipos padronizados.
6. Configurações: form de criar usuário interno (server fn com admin client) + lista + cargos.
7. Página de perfil + avatar no topbar.
8. Aplicar logo oficial.
9. Pass visual final (sobreposições, espaçamentos, tipografia).

## Detalhes técnicos

- Server fn `criarUsuarioInterno` em `src/lib/admin-users.functions.ts`, protegida por `requireSupabaseAuth` + checagem `has_role('admin')`. Usa `supabaseAdmin`.
- Mutations de expedição (publicar/pausar/arquivar) ficam em `src/lib/admin/api.ts` como funções simples chamando `supabase.from('expedicoes').update(...)`.
- Capa: query da lista faz `select('*, expedicao_assets(url, is_capa, ordem)')` e o componente escolhe `capa_url || imagem_url || primeira asset is_capa || primeira asset por ordem`.
- Validação de avatar: tipo MIME ∈ {image/jpeg, image/png, image/webp}, tamanho ≤ 2 MB, antes do upload.

Sem mudanças em IA, automações ou WhatsApp — apenas fundação operacional.