# Fase 2.5 — Simplificação Operacional

Reorganização da camada visual e de navegação do admin, sem tocar em tabelas, triggers, RPCs, IA, auditoria, KB, Contexto 360, financeiro, participantes ou reservas. A inteligência fica intacta no banco; o que muda é como Aline e Lígia operam.

---

## 1. Como o sistema funciona hoje

Sidebar atual com 15+ rotas paralelas:

`Dashboard · Leads · Inbox · Reservas · Participantes · Financeiro · Documentos · Expedições · Operação · Automações · IA · IA-KB · IA-Auditoria · Integrações · Equipe · Cargos · Usuários · Configurações · Histórico · Mídia`

Cada entidade vive em sua própria tela. Para resolver uma única reserva, a usuária navega por:

```text
Leads → abre lead → Reservas → abre reserva → Participantes → volta → Financeiro → Documentos → Inbox
```

O funil de leads tem 7+ status técnicos (`novo`, `triagem_ia`, `qualificado`, `proposta_enviada`, `reserva_pendente`, `participante_confirmado`, `convertido`, `perdido`). Dashboard mostra métricas genéricas, não pendências acionáveis.

## 2. Telas complexas demais

- **Dashboard** — KPIs genéricos, não responde "o que preciso fazer agora?"
- **Leads index** — kanban com status técnicos crus
- **Reserva detalhe** — abas separadas para pagamentos/participantes/docs
- **Participantes index** — lista solta, sem hierarquia expedição→data→grupo
- **Financeiro** — separado da reserva no dia a dia
- **Sidebar** — 15+ itens com peso visual igual entre operação e configuração

## 3. Etapas que podem ser agrupadas

| Hoje (separado) | Novo (agrupado em uma ficha) |
|---|---|
| Lead + Reserva + Participantes + Pagamentos + Docs | **Ficha do Cliente** (visão única) |
| Inbox + Lead + Conversas | aba *Conversas* da ficha |
| Financeiro por reserva | bloco *Pagamento* da ficha |
| Documentos por reserva | bloco *Documentos* da ficha |
| Tarefas relacionadas | bloco *Próxima ação* |

## 4. Módulos que continuam, mas em segundo plano

Movidos para grupo **Avançado** no sidebar (colapsado por padrão), mantendo rotas e código:

- IA · IA-KB · IA-Auditoria
- Automações · Integrações · Webhooks
- Histórico · Auditoria
- Cargos · Usuários · Permissões
- Financeiro (módulo de relatórios)
- Mídia

Continuam funcionando para Bárbara e admin técnico; saem do caminho da operação diária.

## 5. Novo fluxo simplificado

```text
Central Operacional (Dashboard)
        │
        ▼
   Clientes  ──► Ficha do Cliente (tudo em uma tela)
        │           ├─ Cabeçalho: nome, status jornada, próxima ação
        │           ├─ Conversas
        │           ├─ Reserva (expedição, data, grupo)
        │           ├─ Pagamento (total, pago, saldo, registrar)
        │           ├─ Participantes do grupo
        │           ├─ Documentos
        │           └─ Histórico + Tarefas
        ▼
   Expedições ──► Data ──► Grupos/Reservas ──► Participantes
```

**Jornada visual (6 estágios)** mapeada sobre status técnicos existentes:

| Estágio visual | Status técnicos agrupados |
|---|---|
| Interessado | `novo`, `triagem_ia` |
| Em atendimento | `qualificado`, `em_atendimento` |
| Pré-reserva | `proposta_enviada`, `reserva_pendente` |
| Confirmado | `participante_confirmado`, `convertido` |
| Concluído | `concluido` |
| Perdido | `perdido` |

Mapeamento puramente em frontend (helper `jornadaFromStatus()`); banco intacto.

## 6. Telas alteradas

1. **`admin/index` → Central Operacional**
   Substituir KPIs genéricos por filas acionáveis: *Aguardando resposta · Aguardando pagamento · Docs pendentes · Participantes incompletos · Próximas expedições (7 dias) · Tarefas urgentes*. Cada item abre direto a ficha.

2. **`admin/leads` → Clientes**
   Renomear visualmente para "Clientes". Kanban com as 6 colunas da jornada. Card mostra: nome, expedição, próxima ação, status financeiro resumido.

3. **`admin/leads/$id` + `admin/reservas/$id` → Ficha do Cliente unificada**
   Layout editorial em coluna única com seções ancoradas. Lead sem reserva mostra CTA "Criar pré-reserva". Lead com reserva mostra blocos completos. Rotas antigas redirecionam para a ficha unificada.

4. **`admin/participantes` → hierarquia Expedição → Data → Grupo**
   Tela responde rapidamente: ocupação, vagas restantes, fichas incompletas, confirmados, pendentes. Lista solta vira drill-down.

5. **Sidebar reorganizada**

   ```text
   OPERAÇÃO
     Central
     Clientes
     Expedições
     Participantes

   AVANÇADO (colapsado)
     Financeiro · Documentos · Inbox · IA · KB · Auditoria
     Automações · Integrações · Histórico · Mídia

   CONFIGURAÇÃO (colapsado)
     Equipe · Cargos · Usuários · Configurações · Perfil
   ```

## 7. Telas mantidas sem mudança funcional

- Expedições (admin e detalhe)
- Configurações, Perfil, Login
- IA-KB, IA-Auditoria, Automações, Integrações (apenas reposicionadas no sidebar)
- Todas as rotas públicas do site

## 8. Funcionalidades escondidas / reposicionadas

- Inbox vira aba *Conversas* dentro da ficha; rota `/admin/inbox` mantida para visão global em "Avançado"
- Financeiro detalhado vai para "Avançado" como relatório; operação acontece no bloco *Pagamento* da ficha
- Documentos seguem o mesmo padrão
- Status técnicos crus deixam de aparecer; só a jornada de 6 estágios é visível
- Tarefas ficam embutidas na ficha como "Próxima ação"; rota global some do menu principal

## 9. Compatibilidade com Bárbara

- Nenhuma tabela, RPC, trigger, policy ou edge function alterada
- `ia_decisoes`, `ia_interacoes`, `ia_acoes_log`, `ia_handoff_queue`, `lead_memoria`, `mensagens_canal`, `ia_knowledge_base`, `ia_prompts` permanecem como estão
- Status técnicos continuam sendo gravados; mapeamento jornada é só de leitura no frontend
- Contexto 360 segue alimentando a ficha; vira componente embutido em vez de tela separada
- Handoff queue continua acessível via "Avançado" e via badge na ficha do cliente
- Edge functions `ia-shadow`, `ia-shadow-openai`, `ia-prompt-preview`, `contexto-360`, `ia-resolver-cliente`, `ia-contexto-cliente` intactas

## 10. Ordem de implementação

1. **Helpers + design tokens** — `jornadaFromStatus()`, badges de jornada, tokens editoriais (tipografia, espaçamento, cores de status) em `index.css` e `tailwind.config.ts`
2. **Sidebar reorganizada** — 3 grupos (Operação / Avançado / Configuração), sem remover rotas
3. **Central Operacional** — substituir `admin/index` por filas acionáveis
4. **Ficha do Cliente unificada** — nova `admin/clientes/$id` agregando lead+reserva+pagamento+participantes+docs+conversas; redirects das rotas antigas
5. **Clientes (kanban jornada)** — refatorar `admin/leads/index` com 6 colunas e cards enxutos
6. **Participantes hierárquico** — drill-down Expedição→Data→Grupo
7. **Polimento visual** — densidade, hierarquia, remoção de cards redundantes, revisão tela a tela
8. **QA com cenários reais** — os 8 passos do critério (ver contato → abrir → conversa → pré-reserva → pagamento → participantes → pendências → confirmar)

## Detalhes técnicos

- **Sem migrations.** Toda mudança em `src/routes/`, `src/components/admin/`, `src/lib/admin/`, `src/components/ui/sidebar` consumer.
- **Mapeamento jornada** em `src/lib/admin/jornada.ts` (puro TS, sem chamada de rede).
- **Ficha unificada** consome APIs já existentes (`api.ts`, `financeiro-api.ts`, `participantes-actions.ts`, `central-docs-api.ts`, `contexto-360` edge function) — nenhuma nova RPC.
- **Redirects** via `loader` do TanStack Router em `admin/leads/$id` e `admin/reservas/$id` para `admin/clientes/$id`, preservando deep links.
- **Sidebar groups** usam `SidebarGroup` com `defaultOpen={false}` para Avançado/Configuração; rota ativa força abertura do grupo correspondente.
- **Design** segue a memória do projeto: luxo natural, editorial, sem aparência genérica de IA, imagens intencionais.

Aguardando aprovação antes de implementar qualquer item.
