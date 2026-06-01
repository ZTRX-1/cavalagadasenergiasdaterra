## Plano

Vou manter a página `/reserva/$slug` existente, oculta da navegação pública, mas vou fazer o fluxo dela gravar corretamente no CRM.

### 1. Protocolo seguro e não sequencial
- Substituir qualquer lógica fraca/visível tipo `CET-2026-001` ou protocolo gerado no navegador.
- Gerar o protocolo exclusivamente no backend/banco, com formato não sequencial e difícil de adivinhar, por exemplo `CET-2026-K7M9QX`.
- Garantir unicidade real com validação contra a tabela `reservas` antes de aceitar o protocolo.
- Atualizar textos/placeholder da consulta para não sugerirem protocolo sequencial.

### 2. Pré-reserva vira registro real no CRM
- Conectar o submit do formulário multi-etapa de `/reserva/$slug` a uma função segura de backend.
- Ao enviar, criar uma linha em `reservas` com:
  - protocolo gerado no backend
  - expedição, data, responsável, participantes, adicionais e aceites
  - status inicial `pre_reserva_enviada` / `pre_reserva`
  - valores calculados e forma de pagamento
- Criar também um lead em `leads`, para aparecer no CRM de Leads, com origem `pre_reserva_site` e etapa adequada, provavelmente `pronto_reserva`.
- Vincular `reservas.lead_id` ao lead criado.

### 3. Eventos para automação/CRM interno
- Garantir que a criação gere os eventos internos já esperados:
  - `lead_criado`
  - `reserva_criada`
- Incluir no payload dos eventos os dados úteis para automação: protocolo, nome, telefone, email, expedição, data, quantidade de participantes, forma de pagamento e origem.

### 4. Consulta “Minha Reserva” deixa de depender só do aparelho
- Manter compatibilidade com `localStorage` como fallback local.
- Adicionar consulta segura por protocolo no backend para buscar a reserva real no banco.
- Retornar apenas dados mínimos ao visitante, sem abrir dados sensíveis de outras pessoas além do necessário.
- Isso resolve o problema de a reserva só existir no celular/computador onde o formulário foi preenchido.

### 5. Página continua oculta ao público
- Não vou recolocar links públicos para `/reserva/$slug`.
- Os CTAs públicos continuam apontando para WhatsApp como está hoje.
- A página segue acessível apenas por link direto para seus testes e para reativação futura.

### 6. Validação depois da implementação
- Conferir se uma pré-reserva enviada pelo formulário aparece em:
  - `/admin/leads`
  - `/admin/reservas`
- Conferir se o protocolo gerado não é sequencial nem previsível.
- Conferir se o WhatsApp continua abrindo após o envio com o protocolo correto.

## Detalhes técnicos

- Criar/ajustar uma função pública controlada para envio de pré-reserva usando `createServerFn`.
- Usar `supabaseAdmin` apenas no servidor para criar lead e reserva, já que visitante anônimo não deve ter permissão direta de escrita nas tabelas sensíveis.
- Não expor leitura pública ampla em `leads` ou `reservas`.
- Se necessário, ajustar a função `public.gerar_protocolo()` no banco para usar token aleatório não sequencial e garantir unicidade.
- Não mexer na visibilidade pública da rota nem nos CTAs principais do site.