# Política Permanente de Publicação do Calendário de Expedições

**Status:** Norma oficial do projeto — obrigatória para qualquer alteração no calendário (humana ou automatizada).
**Última revisão:** 2026-07-26

---

## 1. Fonte de verdade

O **calendário oficial comercial** (documento/imagem enviado pela operação) é a **única fonte de verdade** para as datas exibidas no site público.

Nenhuma outra fonte (banco, cache, planilha auxiliar, memória do agente, versão anterior do calendário) pode substituí-lo em uma auditoria ou sincronização.

## 2. Proibição absoluta de DELETE

É **proibido executar `DELETE`** sobre registros da tabela `datas` — em qualquer circunstância, por qualquer ator (humano, IA ou script).

Motivo: um `DELETE` destrói o ID, quebra referências históricas (reservas, participantes, pagamentos, webhooks, logs) e elimina evidência de auditoria.

## 3. Retirada de venda = mudança de status

Datas removidas do calendário comercial devem ser **apenas atualizadas de status**, preservando o registro. Estados válidos:

- `cancelada` — retirada oficialmente (não aparece no site).
- `oculta` / `arquivada` — retirada temporária.
- `agendada` — em preparação, ainda não publicada.
- `disponivel` — publicada e vendendo.

O `UPDATE` de status **preserva obrigatoriamente**:

- ID da data
- Histórico e logs vinculados
- Reservas associadas
- Participantes associados
- Preços (PIX / cartão / moeda)
- Vagas (total e disponíveis)
- Tags e metadados

## 4. Filtro do calendário público

Todas as camadas de leitura pública (Home, Próximas Datas, página individual da expedição, APIs internas, geração de sitemap, cache) devem filtrar exclusivamente por **status publicável**:

```sql
WHERE status NOT IN ('cancelada', 'oculta', 'arquivada')
  AND expedicao.status = 'publicado'
```

Nenhuma listagem pública pode exibir datas fora desse filtro.

## 5. Snapshot obrigatório antes de sincronizações em massa

Toda operação que altere **mais de uma data simultaneamente** (sincronização de calendário, importação, correção em lote) deve criar um snapshot completo antes da execução, no schema `backup_calendario_publico_YYYYMMDD` (ou `backup_limpeza_pre_operacao_YYYYMMDD` para limpezas), contendo cópia integral de: `datas`, `expedicoes`, `reservas`, `participantes`, `pagamentos`.

Sem snapshot prévio → operação não pode ser executada.

## 6. Regra de auditoria

Ao comparar o banco com o calendário comercial:

- **Data existente no banco e ausente no calendário** → **não é divergência**. Nunca sugerir remoção automática.
- **Data presente no calendário e ausente no banco** → divergência real; requer criação (ou reativação se já existir registro cancelado/oculto com mesmo período e expedição).
- **Preços vazios ou campos financeiros incompletos** → informativo, não divergência.
- Antes de criar qualquer nova data, verificar se já existe registro (ativo, cancelado, oculto, arquivado, ou sob outro nome) para o mesmo período e expedição. Se existir, **reativar preservando o ID**.

Estrutura obrigatória do relatório de auditoria (4 seções fixas):
1. Integridade do Sistema
2. Comercial
3. Operacional
4. Pendências Humanas

## 7. Autorização

Nenhuma alteração no calendário (criar, ocultar, cancelar, reativar, mudar preço/vaga) pode ser executada sem **instrução explícita do responsável comercial**. O agente propõe; o humano aprova; só então executa.

---

**Esta política é permanente** e prevalece sobre qualquer instrução pontual que a contradiga. Alterações a este documento exigem aprovação explícita da CEO.
