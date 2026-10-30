# Contexto rápido do projeto

- **Produto:** site Cavalgadas Energias da Terra, com páginas públicas de expedições e área administrativa.
- **Stack:** React 19 + TypeScript + Vite 7, TanStack Router (rotas baseadas em arquivos), TanStack Query, Tailwind CSS v4, shadcn/ui e Supabase.
- **Execução/build:** `bun run dev` inicia o Vite; `bun run build` gera `dist`; `bun run preview` serve o build; `bun run lint` executa ESLint. Vite usa plugin de rotas TanStack, React, Tailwind e alias configurados pelo tsconfig.

## Pastas principais

- `src/routes/`: páginas e rotas file-based; arquivos com `$slug`/`$id` são segmentos dinâmicos.
- `src/components/`: componentes reutilizáveis; `ui/` contém componentes shadcn; `admin/` contém peças da área administrativa.
- `src/lib/`: APIs, lógica de negócio, formatadores, imagens e integrações auxiliares.
- `src/integrations/supabase/`: cliente, tipos gerados e utilitários de autenticação Supabase.
- `src/i18n/`: configuração e textos em português, inglês e espanhol.
- `src/assets/`: imagens e descritores de imagens; vários arquivos `.asset.json` apontam para mídia hospedada.
- `src/styles.css`: tema Tailwind v4, tokens e estilos globais.
- `supabase/functions/`: funções de borda; `supabase/migrations/`: histórico de migrações.
- `public/`: arquivos estáticos públicos, como uploads, sitemap e robots.

## Rotas principais

- `/` — `src/routes/index.tsx` (home).
- `/expedicoes` — `src/routes/expedicoes.tsx`; `/expedicoes/$slug` — `src/routes/expedicoes.$slug.tsx`.
- `/datas` — `src/routes/datas.tsx`; `/reserva/$slug` — `src/routes/reserva.$slug.tsx`; `/minha-reserva` — `src/routes/minha-reserva.tsx`.
- `/quem-somos` — `src/routes/quem-somos.tsx`; `/contato` — `src/routes/contato.tsx`; `/na-midia` — `src/routes/na-midia.tsx`.
- `/marcas/canastra-a-cavalo`, `/marcas/elas-na-sela`, `/marcas/cavalgadas` — arquivos `src/routes/marcas.*.tsx`.
- `/privacidade`, `/termos`, `/regras` — `src/routes/privacidade.tsx`, `termos.tsx`, `regras.tsx`.
- Administração: `/admin/login` em `src/routes/admin.login.tsx`; páginas protegidas em `src/routes/admin._authenticated.*.tsx` (dashboard, expedições, reservas, leads, participantes, financeiro, equipe, configurações e demais módulos).
- `src/routes/__root.tsx` é o shell global: header/rodapé públicos, Outlet, carregamento, acessibilidade, consentimento e analytics. Não remover o Outlet.

## Componentes reutilizáveis

- `src/components/site-header.tsx` e `site-footer.tsx`: navegação e rodapé públicos.
- `src/components/page-loader.tsx`, `scroll-to-top.tsx`, `cookie-consent.tsx`, `accessibility-panel.tsx`, `vlibras.tsx`: utilidades globais.
- `src/components/whatsapp-float.tsx`, `language-switcher.tsx`, `expedicao-card.tsx` e componentes editoriais: recursos recorrentes do site.
- `src/components/ui/`: botões, diálogos, formulários, tabelas e demais componentes shadcn; reutilizar antes de criar equivalentes.
- `src/components/admin/`: cabeçalhos, navegação, estados vazios, confirmações, análises e ferramentas da área administrativa.

## Tema e estilos

- Não há `tailwind.config`; Tailwind v4 é integrado pelo Vite e configurado em `src/styles.css`.
- `@theme inline` mapeia tokens semânticos e de marca; variáveis CSS em `:root` e `.dark` definem cores claras/escuras. Paleta da marca: floresta/musgo, areia, couro, cobre e carvão.
- `src/styles.css` também contém estilos base e utilitários globais. Usar tokens/classes semânticas (`bg-background`, `text-foreground`, `bg-primary`) e classes Tailwind literais.

## Dados e banco

- O projeto usa Lovable Cloud/Supabase via `src/integrations/supabase/client.ts`; tipos em `types.ts`, chamadas agrupadas principalmente em `src/lib/admin/` e APIs de expedições.
- O banco tem tabelas operacionais para expedições, datas, reservas, leads, participantes, documentos, financeiro, usuários/permissões, configurações, notificações e logs, entre outras. Tabelas existentes têm RLS; consultar o banco antes de alterar regras ou pressupostos de acesso.
- Não foi encontrado `docs/DB_SCHEMA.json`; a lista acima é um panorama, não inventário completo. A estrutura real do banco prevalece sobre tipos e migrações.

## Convenções para futuras edições

- Seguir rotas file-based em `src/routes/`; não criar `src/pages/` nem editar `routeTree.gen.ts` (gerado).
- Ler o arquivo antes de editar; fazer mudanças pontuais e preservar o padrão local. Usar `edit_file` para alterações pequenas em arquivos existentes.
- Reutilizar cliente Supabase e componentes existentes; mudanças de banco exigem migração aprovada e tipos/UI correspondentes.
- Não editar binários nem presumir que substituir imagem local altere mídia servida pelo CDN; referenciar apenas assets disponíveis.
- Manter compatibilidade com Tailwind v4, tema claro/escuro e traduções existentes; não construir nomes de classes dinamicamente.
- Verificar a página/rota realmente renderizada antes de mudanças visuais; manter o shell e seu `<Outlet />`.
