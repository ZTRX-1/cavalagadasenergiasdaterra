## Visão geral

Reformulação completa do painel administrativo em 7 frentes, organizadas para entregar o que é mais crítico primeiro (permissões + analytics + financeiro), deixando ajustes finos por último. Tudo pensado para usuárias leigas: cada seção ganha um cabeçalho explicativo curto ("o que é isso", "pra que serve", "como usar") e tooltips nos campos não-óbvios.

---

## 1. Permissões e equipe interna (prioridade máxima)

**Modelo de papéis (4 fixos):**

| Papel | Acesso |
|---|---|
| `superadmin` (Vexon Company) | Tudo. Não pode ser excluído nem ter o papel alterado sem **senha-mestre** (`Gadumaconaria33*`, guardada como hash em secret). Só 1 usuário. |
| `ceo` | Tudo, exceto excluir/editar o superadmin. Para as duas sócias quando pagarem a 2ª fase. |
| `socia` | **Edita** apenas Expedições. **Visualiza** Dashboard, Leads, Participantes, Financeiro, Mídia, Documentos, Configurações com banner "Em desenvolvimento — disponível na próxima fase". Não pode salvar nada fora de Expedições. |
| `operador` | Custom — admin marca por checkbox quais módulos vê/edita. |

**Implementação técnica:**
- Migração: ampliar enum `app_role` (`superadmin`, `ceo`, `socia`, `operador`), adicionar tabela `user_permissions (user_id, modulo, pode_ver, pode_editar)` para o `operador`, adicionar coluna `is_protected boolean` em `user_roles` para o superadmin.
- Secret `SUPERADMIN_MASTER_PASSWORD` (recebo do user via add_secret).
- Server fn `deleteInternalUser` exige a senha-mestre quando alvo é `superadmin`.
- Helper `useCan(modulo, acao)` no front que lê o papel + permissões e devolve `{ canView, canEdit }`. Cada página/botão consulta esse hook.
- Sidebar oculta itens sem `canView`. Botões de salvar viram disabled + tooltip "Sem permissão" quando `!canEdit`.
- Banner amarelo "🔒 Em desenvolvimento — você pode visualizar mas ainda não editar" no topo das páginas em modo `socia`.

---

## 2. Dashboard funcional (analytics próprio)

**Tracker interno** (sem dependência externa):

- Tabela `page_views (id, path, referrer, user_agent, country, session_id, created_at)`.
- Server route público `/api/public/track` recebe beacon do site (1 linha JS no `__root.tsx` do site público, `navigator.sendBeacon`).
- Tabela `traffic_sources` derivada do `referrer` (Google, Instagram, WhatsApp, direto, outros).
- Dashboard mostra:
  - KPIs: visitas hoje / 7d / 30d, sessões únicas, taxa de conversão (leads ÷ sessões).
  - Top 10 páginas acessadas (com filtro de período).
  - Origem do tráfego (donut chart).
  - Gráfico de linha últimos 30 dias.
- Filtro de período (hoje, 7d, 30d, custom) em todas as métricas.
- Cabeçalho explicativo: "Aqui você vê em tempo real quantas pessoas visitaram o site, quais expedições mais atraem interesse e de onde elas vieram (Google, Instagram, WhatsApp…)."

---

## 3. Financeiro completo

**Novas tabelas:**
- `despesas (id, data, categoria, descricao, valor, expedicao_id?, anexo_url?, status)` — categorias: cavalos, alimentação, equipe, logística, marketing, hospedagem, transporte, impostos, outros.
- `contas_pagar (id, descricao, valor, vencimento, status, categoria, fornecedor)`.
- `contas_receber` (derivado de reservas + manuais).

**Painel financeiro:**
- Filtro de **calendário** (hoje, mês, ano, custom) global.
- 6 KPIs no topo: Faturamento confirmado, Estimado, Pendente, **Despesas totais**, **Lucro líquido**, **Margem %**.
- Abas: `Receitas` (reservas), `Despesas` (CRUD), `Contas a pagar`, `Contas a receber`, `Fluxo de caixa` (gráfico), `DRE por expedição` (lucro de cada uma).
- Export CSV por período.
- Cabeçalho: "Controle financeiro completo da empresa: o que entrou, o que saiu, o que está previsto, e quanto cada expedição realmente lucrou."

---

## 4. Leads com filtros estratégicos

- Filtros (combo): origem (WhatsApp, site, indicação, manual), expedição de interesse, status (novo, em contato, qualificado, ganho, perdido), status de pagamento (sem reserva, reserva criada, parcial, pago), período.
- Coluna "Conversão" visível: 🟢 pago / 🟡 reserva sem pagar / ⚪ só conversa.
- Botão "Converter em reserva" diretamente do lead (cria reserva já vinculada).
- Cabeçalho: "Cada pessoa que entrou em contato pelo WhatsApp ou pelo site vira um lead aqui. Use os filtros pra ver quem está perto de fechar, quem já pagou, e quem precisa de follow-up."

---

## 5. Participantes — finalidade clarificada

- Reposicionar como **"Lista de viajantes confirmados por data"**: agrupada por expedição → data → participantes (nome, documento, contato emergência, restrições médicas/alimentares, peso para o cavalo, experiência equestre).
- Botão "Exportar lista para o guia" (PDF impresso com tudo que o guia precisa no campo).
- Cabeçalho: "Aqui ficam todos os viajantes confirmados em cada expedição. Use pra montar a lista que vai pro guia, conferir restrições alimentares, peso pro cavalo certo e contatos de emergência."

---

## 6. Documentos — categorização real

Substituir as 5 categorias atuais (institucional/jurídico/operacional/expedição/participantes) por **tipos alinhados à operação**:

| Tipo | Aparece onde |
|---|---|
| Contrato de prestação | anexado a cada reserva, baixável pelo cliente em "Minha Reserva" |
| Termo de responsabilidade | obrigatório no checkout, fica na ficha do participante |
| Política de cancelamento | público no site (rodapé) + anexado em cada reserva |
| Ficha médica | um por participante, privado, só admin/guia |
| Documento jurídico interno | só admin (CNPJ, contrato social, alvarás) |
| Outro | catch-all |

- Cada upload pede: tipo, vinculado a (expedição/reserva/participante/nenhum), validade opcional.
- Cabeçalho explica onde cada tipo é usado e quem vê.

---

## 7. Configurações — propósito claro

Reorganizar em 4 cards com explicação:

- **Dados da empresa** ("usado no rodapé do site, contratos e notas") — nome, CNPJ, endereço, e-mail oficial.
- **Canais de comunicação** ("WhatsApp que recebe os leads e Instagram exibido no site") — WhatsApp, Instagram, e-mails que recebem notificação de nova reserva.
- **Identidade visual** ("logo e cor de destaque aplicados no painel e em e-mails transacionais") — logo, cor.
- **Equipe interna** (movido para nova rota `/admin/equipe` com modelo de permissões da seção 1).

---

## 8. UX e responsividade (ajustes finais)

- **Padding interno** dos cards (`AdminSection`, "Checklist de publicação", "Mídia") aumentado de `p-4` para `p-6 md:p-8` para o texto respirar.
- **Expedições mobile**: revisar `expedicoes.index` e `expedicoes.$id` em 390px — tabela vira lista de cards, abas com scroll horizontal, botões de ação stack vertical.
- **Cabeçalho explicativo** padronizado em toda página: componente `<AdminPageIntro>` com ícone + 2-3 linhas em texto cinza claro.
- **Tooltips** (`?` ao lado de labels não-óbvios) com explicação curta.

---

## Faseamento sugerido

```text
Fase 1 (esta entrega)
├── Permissões + superadmin protegido + senha-mestre
├── Cabeçalhos explicativos em todas as 8 páginas
├── Padding/responsividade (rápido)
└── Filtros de Leads

Fase 2
├── Analytics próprio (tabela + tracker + dashboard)
└── Financeiro completo (despesas + contas + DRE)

Fase 3
├── Documentos recategorizados
├── Participantes redesenhado + export PDF guia
└── Configurações reorganizadas
```

Posso executar tudo de uma vez ou ir fase a fase — me diga sua preferência ao aprovar. Se aprovar como está, começo pela Fase 1 e já solicito a senha-mestre como secret na primeira ação.

---

## Detalhes técnicos

- Migrações: novo enum `app_role`, tabelas `user_permissions`, `page_views`, `traffic_sources`, `despesas`, `contas_pagar`. RLS: leitura por `is_internal_user`, escrita gated por `has_role` + `user_permissions`. GRANTs explícitos.
- Server fns novas: `trackPageView` (público, rate-limited), `listDashboardMetrics`, `listDespesas`/`createDespesa`/`updateDespesa`/`deleteDespesa`, `deleteInternalUser` (com check de senha-mestre via bcrypt compare).
- Secrets: `SUPERADMIN_MASTER_PASSWORD` (hash bcrypt).
- Frontend: hook `useCan`, componente `<AdminPageIntro>`, `<DateRangeFilter>` reutilizável, `<EmDesenvolvimentoBanner>`.
- Nada quebra o site público.
