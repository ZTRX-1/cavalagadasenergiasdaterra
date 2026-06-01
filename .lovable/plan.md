## Diagnóstico

- O backend está saudável, mas `leads`, `reservas` e `webhooks_eventos` estão vazios: o teste que você fez não chegou no banco.
- O preview quebrou por erro no navegador: `AsyncLocalStorage is not a constructor` vindo de `@tanstack/react-start` no bundle client.
- A causa provável é que a página pública de pré-reserva passou a importar `useServerFn` / `createServerFn`, e isso colocou código de servidor no pacote do navegador nesta configuração atual do projeto.
- Também vi que os triggers de `lead_criado` e `reserva_criada` não existem no banco, apesar das funções estarem definidas. Então mesmo que inserisse, os eventos internos de automação não seriam criados automaticamente hoje.

## Plano de correção

### 1. Destravar o preview e o site
- Remover o uso de `@tanstack/react-start` do lado do navegador na pré-reserva e em “Minha Reserva”.
- Trocar esse caminho por rotas HTTP internas em `/api/public/...`, que são próprias para chamadas públicas de formulário.
- Assim o formulário volta a carregar sem quebrar a tela branca.

### 2. Criar endpoints públicos controlados para pré-reserva
- Criar um endpoint para envio da pré-reserva, por exemplo `/api/public/pre-reserva`.
- Criar um endpoint para consulta por protocolo, por exemplo `/api/public/reserva-status`.
- Ambos terão validação forte dos campos com Zod.
- O endpoint de envio usará o backend com permissão segura de servidor para gravar em `leads` e `reservas`, sem abrir permissão pública direta nas tabelas.

### 3. Fazer a pré-reserva virar lead e reserva real
- No envio do formulário `/reserva/$slug`, gravar:
  - um registro em `leads` com `origem = pre_reserva_site`, `status = pronto_reserva`, `etapa_atendimento = pronto_reserva`, `lead_score = 80`;
  - um registro em `reservas` vinculado ao lead, com `status = pre_reserva_enviada`, `status_operacional = pre_reserva`, `status_financeiro = aguardando_pagamento`.
- Manter a página oculta da navegação pública. Não vou criar botão/link público para ela.

### 4. Corrigir protocolo seguro
- Manter o protocolo no banco como `CET-ANO-TOKEN`, com token aleatório sem caracteres ambíguos.
- Garantir unicidade contra `reservas` antes de salvar.
- Não usar sequência tipo `001`, `002`, etc.

### 5. Reativar eventos internos de automação
- Criar os triggers que chamam as funções existentes:
  - ao criar lead: gerar evento `lead_criado` em `webhooks_eventos`;
  - ao criar reserva: gerar histórico e evento `reserva_criada` em `webhooks_eventos`.
- Isso deixa a automação futura consumindo os eventos certos.

### 6. Ajustar o painel interno se necessário
- Conferir se `/admin/leads` lista o lead criado.
- Conferir se `/admin/reservas` lista a reserva criada.
- Se houver filtro/etapa escondendo `pronto_reserva`, ajustar a visualização para mostrar esse lead claramente.

### 7. Validar com um teste real
- Fazer uma submissão de pré-reserva com dados fictícios realistas.
- Confirmar no banco que criou:
  - `leads`;
  - `reservas`;
  - `webhooks_eventos`.
- Confirmar que o protocolo gerado não é sequencial.
- Confirmar que a consulta em `/minha-reserva` busca pelo banco, não só pelo `localStorage`.