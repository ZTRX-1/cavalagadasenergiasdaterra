# REESTRUTURAÇÃO COMPLETA DO CRM OPERACIONAL

## ESCOPO

NÃO ALTERAR:

- Cadastro de Expedições
- Publicação de Expedições
- Próximas Datas
- Gestão de Expedições
- Usuários
- Equipe
- Permissões
- Cargos
- Configurações Gerais

ALTERAR E REESTRUTURAR:

- CRM / Leads
- Atendimento
- Reservas
- Participantes
- Documentos
- Financeiro
- Inbox
- IA
- Pós-venda
- Reativação

---

# 1. NOVO FUNIL OPERACIONAL

Substituir o Kanban atual.

O objetivo é que qualquer pessoa da equipe consiga entender imediatamente em que etapa o cliente está.

## Colunas principais

NOVO

↓

EM ATENDIMENTO

↓

PROPOSTA ENVIADA

↓

RESERVA CONFIRMADA

↓

EXPEDIÇÃO REALIZADA

↓

PERDIDO

## Coluna paralela

REATIVAÇÃO

A coluna REATIVAÇÃO não faz parte do funil principal.

Ela será utilizada para:

- Clientes antigos
- Participantes de expedições anteriores
- Leads sem interação há mais de 90 dias
- Campanhas de retorno

---

# 2. MAPEAMENTO AUTOMÁTICO DOS LEADS EXISTENTES

Migrar automaticamente:

novo  
→ NOVO

qualificado  
→ EM ATENDIMENTO

em_atendimento  
→ EM ATENDIMENTO

proposta_enviada  
→ PROPOSTA ENVIADA

reserva_confirmada  
→ RESERVA CONFIRMADA

concluido  
→ EXPEDIÇÃO REALIZADA

perdido  
→ PERDIDO

Qualquer etapa desconhecida:

→ EM ATENDIMENTO

Nunca perder dados históricos.

---

# 3. FICHA DO CLIENTE (LEAD 360 SIMPLIFICADO)

Remover excesso de informação da tela principal.

A ficha passa a possuir apenas:

## DADOS PRINCIPAIS

- Nome
- Telefone
- WhatsApp
- E-mail
- Cidade
- Estado
- Data de nascimento
- Idade calculada

## INTERESSE

- Expedição
- Data escolhida
- Quantidade de participantes
- Forma de pagamento

## OBJETIVO

Texto original preenchido pelo cliente.

Sem interpretação da IA.

## RESTRIÇÕES

Texto original preenchido pelo cliente.

Sem interpretação da IA.

## OBSERVAÇÕES

Texto original preenchido pelo cliente.

---

# 4. ABAS DA FICHA

Substituir o modelo atual por:

- Cliente
- Participantes
- Financeiro
- Documentos
- Conversas
- IA

Remover o conceito de aba "Avançado".

---

# 5. MEMÓRIA IA

Separar completamente:

## FATOS

Informações declaradas pelo cliente.

Exemplos:

- Diabético
- Sorocaba
- Iniciante
- Cartão
- Grupo de 4 pessoas

## INFERÊNCIAS

Informações deduzidas pela IA.

Exemplos:

- Perfil aventureiro
- Interesse em natureza
- Possível retorno futuro

Toda memória criada pela IA deve possuir:

tipo = fato

ou

tipo = inferencia

Nunca misturar os dois.

---

# 6. ATENDIMENTO AUTOMÁTICO DA IA

Quando um lead entrar em NOVO:

A IA recebe:

- Nome
- Telefone
- E-mail
- Cidade
- Estado
- Idade
- Expedição
- Data
- Participantes
- Experiência
- Objetivo
- Restrições
- Forma de pagamento

Prazo máximo para iniciar contato:

5 minutos

Caso não aconteça:

Criar automaticamente:

- Alerta operacional
- Notificação
- Tarefa crítica

---

# 7. OBJETIVOS DA IA

A IA não deve ser apenas um chatbot.

Ela precisa cumprir etapas.

Objetivos:

1. Receber o lead
2. Confirmar interesse
3. Qualificar perfil
4. Explicar a expedição
5. Apresentar valores
6. Responder dúvidas
7. Coletar documentos
8. Acompanhar pagamento
9. Confirmar participação
10. Realizar pós-venda

---

# 8. RESPONSÁVEL X PARTICIPANTES

Separação obrigatória.

Estrutura:

Reserva

└── Responsável

└── Participante 1

└── Participante 2

└── Participante 3

...

O responsável não deve ser confundido com os participantes.

---

# 9. PARTICIPANTES

Cada participante possui ficha própria.

Campos:

- Nome
- Documento
- Data de nascimento
- Idade
- Peso
- Nível de experiência
- Restrições médicas
- Observações

---

# 10. DOCUMENTOS

Migrar documentos para vínculo principal com participante.

Tipos:

- Documento pessoal
- Contrato
- Comprovante de pagamento
- Ficha médica
- Termo de responsabilidade
- Arquivos extras

Status:

- Não iniciado
- Parcial
- Completo

---

# 11. RESERVAS

Adicionar status operacional independente do funil.

Status possíveis:

- Pré-reserva
- Aguardando pagamento
- Sinal pago
- Quitada
- Cancelada

O status financeiro não deve depender do status do lead.

---

# 12. FINANCEIRO

Adicionar suporte real para múltiplas moedas.

Campos:

- valor_original
- moeda_original
- cotacao
- valor_convertido_brl

Exemplo:

USD 2.500 × 5,62

=

R$ 14.050

Também exibir:

- Valor vendido
- Valor recebido
- Saldo pendente
- Data limite de pagamento

---

# 13. INBOX UNIFICADO

Criar timeline única por cliente.

Fontes:

- WhatsApp
- Instagram
- Site
- E-mail
- Telefone

Tudo agrupado na mesma conversa.

Não separar por canal.

Separar por cliente.

---

# 14. PÓS-VENDA

Quando:

Data da expedição < hoje

E

Reserva Confirmada

Mover automaticamente para:

EXPEDIÇÃO REALIZADA

Exibir:

- Expedição realizada
- Data
- Participantes
- Valor pago

Preparar gatilhos futuros para:

- Depoimentos
- Remarketing
- Novas expedições

---

# 15. REATIVAÇÃO

Critérios:

Lead sem interação há mais de 90 dias

OU

Cliente com expedição realizada há mais de 6 meses

Aparece apenas na coluna REATIVAÇÃO.

Nunca misturar com PERDIDO.

---

# 16. FORMULÁRIO DE RESERVA

Manter as 5 etapas.

1. Responsável
2. Participantes
3. Experiência
4. Pagamento
5. Confirmação

Corrigir:

- Perda de dados
- Inconsistência de participantes
- Campos que não refletem corretamente no CRM

Implementar:

- Salvamento automático
- LocalStorage
- Lead progressivo por etapa

---

# FASES DE EXECUÇÃO

## FASE A

Backend

- Migrations
- Novos enums
- Memória IA
- Multimoeda
- Documentos por participante
- Triggers

VALIDAÇÃO

---

## FASE B

Novo CRM

- Novo Kanban
- Nova Ficha
- Novas Abas

VALIDAÇÃO

---

## FASE C

Participantes e Documentos

- Ficha individual
- Contratos
- Documentos

VALIDAÇÃO

---

## FASE D

Inbox + IA

- Inbox unificado
- IA automática
- Alertas

VALIDAÇÃO

---

## FASE E

Pós-venda

- Reativação
- Automações
- Ajustes finais

VALIDAÇÃO

---

IMPORTANTE

Não remover componentes antigos.

Visão 360, Resumo IA, Conhecimento Aplicável e componentes legados devem permanecer funcionando internamente e serem movidos para a aba IA, preservando compatibilidade e evitando perda de desenvolvimento já realizado.