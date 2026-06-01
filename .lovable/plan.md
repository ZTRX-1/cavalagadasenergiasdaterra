# Reestruturação completa do painel interno

Escopo enorme. Vou preservar a página de cadastro/gestão de Expedições (não mexer), reorganizar o restante do admin em torno de um fluxo CRM → Reserva → Financeiro → Documentos, e deixar tudo preparado para automações futuras (webhooks, IA, WhatsApp) sem implementá-las agora.

Linguagem do painel será 100% sem jargão: "Nível de Interesse", "Etapa do Atendimento", "Aguardando Pagamento", "Saldo a Receber" etc.

---

## O que será entregue (faseado)

### Fase A — Banco + CRM de Leads reformulado

- Expansão da tabela `leads`: adicionar `nivel_interesse` (1-5), `etapa_atendimento` (enum: novo, em_atendimento, qualificado, interessado, pronto_reserva, encaminhado_financeiro, pago, perdido), `responsavel_id`, `resumo_atendimento`, `ultima_interacao_at`, `data_interesse`.
- Nova tabela `lead_conversas` (registro cronológico de cada interação — WhatsApp, ligação, e-mail, nota interna).
- Nova tabela `webhooks_eventos` (fila de eventos disparados: `lead_criado`, `lead_qualificado`, `lead_pronto_reserva`, `reserva_criada`, `pagamento_confirmado`) — apenas grava, ninguém consome ainda. Base para n8n/OpenAI/WhatsApp depois.
- Página `/admin/leads` redesenhada como Kanban + Lista, com filtros por etapa, responsável, expedição, nível de interesse.
- Detalhe do lead com timeline de conversas, botão "Converter em reserva".

### Fase B — Reservas + Financeiro completo

- Reservas: já existe, vou adicionar campos `contrato_enviado`, `contrato_assinado`, `saldo_pendente` (calculado), e os status pedidos (pré-reserva, aguardando pagamento, parcial, pago, confirmado, cancelado).
- Nova página `/admin/reservas` (hoje só existe dentro de leads/financeiro de forma esparsa) com lista + filtros + criação manual vinculada a lead.
- Financeiro: módulo já existe (Receitas/Despesas/DRE), vou apenas:
  - Renomear rótulos para linguagem leiga ("Receita Prevista", "Receita Recebida", "Custos Previstos", "Custos Realizados", "Lucro Estimado", "Lucro Realizado").
  - Adicionar coluna `previsto` vs `realizado` nas despesas.

### Fase C — Notas Fiscais & Documentos

- Nova tabela `notas_fiscais` (empresa, cnpj, data, valor, categoria, expedicao_id, arquivo_url, dados_extraidos jsonb — placeholder para IA futura).
- Nova rota `/admin/notas-fiscais` com upload de PDF/XML/imagem e listagem.
- Documentos existentes ficam como estão (já foi recategorizado em fase anterior).

### Fase D — Configurações da IA + Histórico

- Nova tabela `configuracoes_ia` (horario_atendimento, mensagem_fora_horario, whatsapp_comercial, whatsapp_financeiro, perguntas_qualificacao jsonb, regras_encaminhamento jsonb) — somente armazena, IA não está ligada.
- Nova rota `/admin/configuracoes/ia` (aba dentro de Configurações).
- Histórico: `activity_logs` já existe. Vou adicionar triggers em `leads`, `reservas`, `despesas` que gravam automaticamente mudanças de status e valores, e uma página `/admin/historico` com timeline filtrável.

---

## O que NÃO faço

- Página de cadastro/gestão de Expedições (`/admin/expedicoes/*`) fica intocada, conforme pedido.
- Nenhuma automação real (sem chamar n8n, OpenAI ou WhatsApp). Só a estrutura de eventos e tabelas.
- Sem mudar o site público.

---

## Como vai funcionar a execução

Vou rodar como **4 mensagens sequenciais** (Fase A → B → C → D), cada uma:

1. Migration do banco (você aprova).
2. Código da UI + APIs (server functions).
3. Verificação visual.

Cada fase fica funcional sozinha — se quiser pausar entre elas, o sistema continua usável.

---

## Decisões que preciso confirmar antes de começar

1. **Fluxo de execução**: começo agora pela **Fase A (CRM de Leads)** e sigo automaticamente para B, C, D em mensagens separadas? Ou prefere aprovar fase a fase?
2. **Kanban vs Lista** na tela de Leads: faço Kanban como visão padrão (mais visual, "premium") com toggle para Lista? Ou só Lista com filtros?
3. **WhatsApp**: as conversas em `lead_conversas` serão por enquanto **registradas manualmente** pela equipe (nota interna, "liguei", "mandei mensagem"). A sincronização automática com WhatsApp fica para a fase de integração. OK?

Responda essas 3 e eu começo pela Fase A já com a migration do banco.

&nbsp;

**APROVAÇÃO DO PLANO COM AJUSTES ESTRATÉGICOS**

O plano proposto está alinhado com a direção do projeto e pode seguir em execução por fases.

Aprovado:

- Fase A — CRM de Leads
- Fase B — Reservas e Financeiro
- Fase C — Notas Fiscais e Documentos
- Fase D — Configurações da IA e Histórico

Manter a página de Expedições completamente intacta, conforme definido anteriormente.

Quero apenas realizar alguns ajustes estruturais antes da execução para garantir compatibilidade futura com:

- OpenAI
- WhatsApp
- n8n
- Automações
- CRM inteligente
- Memória conversacional
- Lead Scoring

&nbsp;

**AJUSTES NA FASE A**

**1. LEAD SCORE**

Adicionar campo:

lead_score

Tipo:  
inteiro de 0 a 100

Objetivo:

Preparar o sistema para classificação automática de leads no futuro.

Exemplo:

- Interesse em datas
- Interesse em preços
- Interesse em disponibilidade
- Pedido de reserva

Esses eventos poderão aumentar automaticamente a pontuação do lead.

&nbsp;

**2. CAMPOS DE ORIGEM DE TRÁFEGO**

Além do campo origem, adicionar:

- utm_source
- utm_medium
- utm_campaign

Objetivo:

Permitir rastreamento completo das campanhas e canais de aquisição.

&nbsp;

**3. RESUMO HUMANO E RESUMO IA**

Separar os campos:

- resumo_atendimento
- resumo_ia

Objetivo:

Permitir que a IA gere resumos automáticos enquanto a equipe mantém observações próprias.

&nbsp;

**4. PRÓXIMA AÇÃO**

Adicionar campo:

proxima_acao

Exemplos:

- Aguardar retorno
- Enviar contrato
- Enviar link de pagamento
- Confirmar vaga
- Entrar em contato amanhã

Objetivo:

Facilitar a gestão operacional da equipe.

&nbsp;

**5. CANAIS**

Adicionar:

- canal_entrada
- canal_atendimento

Exemplos:

Canal de entrada:

- Site
- Instagram
- Google
- Indicação

Canal de atendimento:

- WhatsApp
- Telefone
- Presencial
- E-mail

Objetivo:

Melhor rastreabilidade da jornada do cliente.

&nbsp;

**6. LEAD_CONVERSAS**

Adicionar campo:

tipo_evento

Valores:

- mensagem_ia
- mensagem_humana
- ligacao
- pagamento
- contrato
- alteracao_status
- observacao_interna

Objetivo:

Criar histórico completo e auditável.

&nbsp;

**7. MEMÓRIA PREPARADA PARA IA**

Criar tabela:

lead_memoria

Campos:

- lead_id
- perfil
- objetivos
- interesses
- restricoes
- expedicoes_favoritas
- orcamento
- dados_extraidos
- ultima_atualizacao

Objetivo:

Preparar o sistema para memória conversacional futura sem necessidade de reestruturação do banco.

&nbsp;

**KANBAN**

A visualização principal do CRM deve ser:

KANBAN

Com opção secundária de visualização em lista.

Etapas:

- Novo
- Em Atendimento
- Qualificado
- Interessado
- Pronto para Reserva
- Encaminhado ao Financeiro
- Pago
- Perdido

Motivo:

Usuárias não técnicas terão melhor entendimento visual do fluxo.

&nbsp;

**WHATSAPP**

Neste momento, as conversas permanecerão registradas manualmente.

Não implementar integração automática ainda.

Apenas garantir que toda a estrutura esteja preparada para integração futura com:

- WhatsApp
- OpenAI
- n8n
- Chatwoot

&nbsp;

**EXECUÇÃO**

Pode iniciar pela Fase A.

Após concluir a Fase A, apresentar a migration do banco, APIs e interface para validação antes de avançar para a Fase B.

Objetivo final:

Construir um sistema operacional completo para a Cavalgadas Energias da Terra, preparado para CRM inteligente, automações, atendimento por IA, reservas, financeiro e crescimento futuro sem necessidade de refatorações estruturais.