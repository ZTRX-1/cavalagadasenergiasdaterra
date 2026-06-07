# Evolução CRM de Leads → IA Bárbara (Versão Aprovada)

Objetivo: preparar o CRM para a IA Bárbara atender, qualificar e atualizar leads em tempo real, sem recriar telas e sem alterar o design atual.

## 1. Banco de Dados

### Tabela Leads

Manter os campos existentes:

- resumo_ia
- lead_score
- proxima_acao
- ultima_interacao_at
- etapa_atendimento
- status
- resumo_atendimento

Adicionar:

- temperatura_lead (frio | morno | quente | urgente)
- status_atendimento (ia | humano | transferido | encerrado)
- motivo_perda (preco | data | sem_disponibilidade | nao_respondeu | concorrente | outro)
- motivo_perda_detalhe (texto livre)

Adicionar também:

- expedicao_id
- data_expedicao_id

Objetivo:

Permitir que a IA saiba exatamente qual expedição e qual data o lead deseja, sem precisar reler toda a conversa.

---

### Lead Score Inteligente

O campo lead_score deve possuir estrutura para atualização automática por IA e automações.

Exemplo de lógica:

+10 primeira interação

+10 informou expedição

+10 informou data

+15 informou quantidade de participantes

+20 demonstrou intenção de reserva

+20 perguntou pagamento

+15 solicitou contrato

Reduções:

-20 sem interação por período definido

-30 lead perdido

O objetivo é manter uma pontuação de 0 a 100.

---

### Tabela lead_conversas

Reaproveitar a estrutura existente.

Campos atuais já atendem:

- lead_id
- canal
- autor_nome
- autor_id
- direcao
- tipo_evento
- conteudo
- metadata
- created_at

Padronizar eventos:

Conversas:

- mensagem_recebida
- mensagem_enviada
- ligacao
- observacao_interna

Timeline:

- lead_criado
- primeira_mensagem
- qualificado
- pronto_reserva
- transferido_humano
- reserva_criada
- convertido
- perdido
- alteracao_status
- alteracao_temperatura

---

### Triggers

Estender trigger existente para registrar:

- mudança de temperatura_lead
- mudança de status_atendimento

Criar trigger:

lead_criado_timeline

Ao criar um lead:

Registrar automaticamente evento:

tipo_evento = lead_criado

---

## 2. Interface (Sem Redesign)

### Ficha do Lead

Adicionar:

- Temperatura
- Status de Atendimento
- Motivo da Perda

Quando aplicável.

---

### Conversas e Timeline

Na área de histórico:

Separar visualmente:

- Conversas
- Timeline

Utilizando filtros locais.

Sem criar nova rota.

---

### Header do Lead

Adicionar badge de temperatura:

- 🥶 Frio
- 🌤️ Morno
- 🔥 Quente
- 🚨 Urgente

Reutilizar componentes existentes.

---

### Kanban

Adicionar:

- Temperatura do lead
- Lead Score

Nos cards.

---

## 3. API Interna da IA Bárbara

Criar rota:

/api/public/ia-barbara/leads

Autenticação:

Bearer IA_BARBARA_API_KEY

---

### Endpoints

GET

Buscar lead por:

- id
- telefone
- email

Retornar:

- Lead
- Memória
- Conversas
- Timeline

---

POST action=upsert_lead

Criar ou atualizar lead.

---

POST action=update_campos

Atualizar:

- temperatura
- score
- status
- próxima ação
- resumo IA
- motivo perda

---

POST action=registrar_conversa

Registrar mensagem da IA ou do lead.

---

POST action=registrar_timeline

Registrar evento.

---

POST action=transferir_humano

Atualizar:

status_atendimento = humano

Registrar timeline.

Disparar webhook.

---

GET action=expedicoes

Retornar:

- Expedições
- Datas
- Valores
- Vagas
- Disponibilidade
- FAQ
- Requisitos
- Como chegar
- O que inclui
- O que não inclui

---

### Endpoint de Disponibilidade

Criar endpoint específico para consulta de disponibilidade em tempo real.

A IA deve sempre consultar:

- vagas_disponiveis
- status da data

Antes de informar disponibilidade ao cliente.

Objetivo:

Evitar informar vagas incorretamente quando houver poucas vagas restantes.

---

## 4. Expedições

Manter banco como fonte principal.

A IA deve consultar prioritariamente:

- Datas
- Valores
- Vagas
- Disponibilidade
- FAQ
- Como chegar
- Requisitos
- Nível da experiência
- O que está incluso
- O que não está incluso

PDFs devem funcionar apenas como conhecimento complementar.

Em caso de conflito:

CRM e Banco de Dados sempre têm prioridade sobre PDFs.

---

## 5. Compatibilidade

Garantir compatibilidade futura com:

- Supabase
- N8N
- WhatsApp API
- OpenAI
- Base vetorial
- Atendimento híbrido IA + humano

---

## Entrega Final

Ao concluir:

Apresentar relatório contendo:

- O que foi criado
- O que foi alterado
- O que foi reaproveitado
- Possíveis melhorias futuras

Sem alterar design.

Sem remover funcionalidades existentes.

Sem recriar módulos desnecessariamente.

Priorizar reaproveitamento da arquitetura atual.