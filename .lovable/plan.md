Os ajustes finais da Etapa 1 foram implementados para garantir consistência operacional absoluta.

### Alterações Realizadas

#### 1. Memória do Lead para IA
- **Automação de Dados**: Atualizei o gatilho de banco de dados para preencher automaticamente os campos de **Perfil, Objetivos, Interesses, Restrições e Orçamento**.
- **Perfil Inteligente**: Agora a IA infere o tipo de grupo (individual, casal, família) e a idade do responsável.
- **Detecção de Objetivos**: Identifica automaticamente se a busca é por aventura, descanso, integração em grupo ou exclusividade feminina.
- **Orçamento e Pagamento**: Vincula os valores reais da reserva e a forma de pagamento escolhida diretamente na memória.
- **Visualização**: O resumo gerado por IA agora respeita as quebras de linha para melhor leitura no painel.

#### 2. Consistência Financeira (Receita Confirmada)
- **Regra de Negócio**: Ajustei os cálculos no Dashboard e na tela de Participantes. Quando uma reserva é marcada como **Confirmada**, o valor total migra automaticamente de "Receita Prevista" para **"Receita Confirmada"**, independentemente do status individual das parcelas, garantindo que o faturamento operacional seja refletido em tempo real.

#### 3. Filtros e Layout de Participantes
- **Correção de Filtros**: O filtro "Somente Reservas Confirmadas" foi corrigido para buscar corretamente o status operacional da reserva vinculada, exibindo os participantes ativos conforme esperado.
- **Layout Responsivo**: Ajustei os seletores e labels na tela de participantes para evitar cortes de texto e garantir usabilidade em telas menores, mantendo labels completas como "Situação Financeira" e "Status Participante".

### Detalhes Técnicos
- **Triggers**: Atualização da função `gerar_resumo_ia_lead` no banco de dados.
- **Frontend**: Refatoração da lógica de filtragem e estilização em `src/routes/admin._authenticated.participantes.index.tsx`.
- **Dashboard**: Sincronização da lógica de faturamento em `src/routes/admin._authenticated.index.tsx` para manter paridade com a visão de participantes.

A arquitetura da Etapa 1 está agora congelada e validada, com tráfego de dados íntegro desde a entrada do lead até a confirmação operacional e financeira.