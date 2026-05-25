# Área Restrita Premium — Etapa 1/3

Construção da fundação do painel operacional interno da Cavalgadas Energias da Terra. Foco exclusivo em estrutura, autenticação, layout e dashboard visual. Nenhuma automação, IA, WhatsApp ou pagamento nesta etapa.

---

## 1. Autenticação (Lovable Cloud)

- Habilitar autenticação por **e-mail + senha** (sem auto-confirm — operadores criados internamente).
- **Sem signup público.** Acesso apenas para usuários cadastrados pela administração.
- Tabela `profiles` (id, user_id, nome, avatar_url, cargo) + trigger de criação automática.
- Tabela `user_roles` com enum `app_role` (`admin`, `operador`, `financeiro`, `midia`) + função `has_role()` SECURITY DEFINER (padrão seguro, sem recursão de RLS).
- RLS em todas as tabelas internas exigindo `auth.uid()` + role apropriada.

## 2. Estrutura de Rotas

```
/admin/login                  → tela de login pública
/admin/_authenticated         → layout protegido (beforeLoad guard)
  /admin                      → Dashboard
  /admin/expedicoes
  /admin/leads
  /admin/participantes
  /admin/financeiro
  /admin/midia
  /admin/documentos
  /admin/configuracoes
```

Cada rota interna é apenas a estrutura visual + placeholder elegante ("Em breve") quando ainda sem dados — exceto Dashboard, que é completo.

## 3. Tela de Login Premium

- Background cinematográfico (imagem existente da Canastra com overlay carvão denso).
- Card central com **glassmorphism**: blur, borda 1px dourada translúcida, sombra profunda.
- Logo centralizado, tipografia editorial (display serif + sans).
- Campos: e-mail, senha, "lembrar acesso", link "esqueci minha senha".
- Botão CTA dourado suave com glow discreto e micro-animação no hover.
- Loading elegante (spinner minimalista) e feedback de erro refinado.
- Totalmente responsivo.

## 4. Layout do Painel

- **Sidebar fixa esquerda** (240px), colapsável para 64px (modo ícone):
  - Logo no topo
  - Menu vertical com ícones lucide + label
  - Item ativo: indicador dourado lateral + fundo glass
  - Rodapé: avatar + nome do usuário + menu (perfil / sair)
- **Topbar superior** (56px): breadcrumb à esquerda, busca global (visual), notificações (visual), toggle de tema.
- **Área principal**: padding generoso, scroll suave, fundo carvão profundo com gradiente sutil.
- Design system: tokens em `src/styles.css` (carvão, petróleo, dourado, cinzas premium, vidros).

## 5. Dashboard Principal

Grid responsivo de cards premium:

- **KPIs (topo)** — 4 cards compactos com número grande, label, ícone e tendência:
  - Leads do mês
  - Pré-reservas ativas
  - Expedições ativas
  - Vagas restantes
- **Faturamento estimado** — card maior com gráfico de linha/área (recharts), valores mockados.
- **Próximas expedições** — lista elegante (data, nome, vagas, status badge).
- **Últimas atividades** — timeline minimalista (placeholder com dados estáticos).

Microinterações: hover lift sutil, skeleton loading, fade-in escalonado nos cards.

## 6. Banco de Dados — Estrutura Inicial

Novas tabelas (limpas, escaláveis, com RLS):

- `profiles` — perfil do operador
- `user_roles` — vínculo usuário ↔ papel
- `leads` — id, nome, email, telefone, expedicao_interesse, origem, status, observacoes
- `participantes` — id, reserva_id, nome, documento, contato, observacoes_medicas
- `midia` — id, tipo, url, expedicao_id, titulo, ordem
- `documentos` — id, titulo, tipo, url, expedicao_id, participante_id

Tabelas existentes (`expedicoes`, `datas`, `reservas`) são reutilizadas — apenas leitura no painel nesta etapa.

## 7. Paleta & Tokens (adicionar em `src/styles.css`)

- `--carvao-profundo` — fundo principal
- `--petroleo` — superfícies elevadas
- `--dourado-suave` — accent
- `--cinza-premium-1/2/3` — texto e bordas
- `--vidro-fosco` — glassmorphism base
- `--glow-dourado` — sombras de destaque
- Gradientes: `--gradient-glass`, `--gradient-petroleo`

## 8. Responsividade

- Desktop ≥1280px: layout completo (prioridade máxima)
- Notebook 1024–1279px: sidebar colapsa automaticamente
- Tablet: sidebar vira drawer
- Mobile: drawer + cards empilhados, topbar simplificado

## 9. Fora de Escopo (Etapas 2 e 3)

Não implementar nesta etapa: automações, IA, WhatsApp, pagamentos, fluxos automáticos, edição de leads/participantes, upload real de mídia/documentos, relatórios financeiros avançados.

---

## Detalhes Técnicos

- **Stack:** TanStack Router (file-based) + TanStack Query + Supabase (Lovable Cloud).
- **Auth guard:** rota pathless `_authenticated` com `beforeLoad` validando sessão via `supabase.auth.getUser()`; redirect para `/admin/login` se ausente.
- **Sidebar:** componente `shadcn/ui sidebar` com `collapsible="icon"`.
- **Gráficos:** `recharts` (já disponível via shadcn chart).
- **Ícones:** `lucide-react`.
- **Dados do dashboard:** server functions (`createServerFn` + `requireSupabaseAuth`) com queries agregadas nas tabelas existentes; valores ainda não cobertos vêm como mock estático claramente isolado para fácil substituição na Etapa 2.
- **Migrations:** uma migration única criando enum, `profiles`, `user_roles`, `has_role()`, `leads`, `participantes`, `midia`, `documentos`, com RLS.
- **Site público:** intocado. Toda área restrita vive sob `/admin/*`.

## Perguntas antes de implementar

1. Quer que eu crie um **primeiro usuário admin** via SQL (você me passa o e-mail) ou prefere criar manualmente pelo painel Cloud depois?
2. Confirma os 4 papéis (`admin`, `operador`, `financeiro`, `midia`) ou prefere começar só com `admin` e `operador`?
