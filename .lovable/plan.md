## Refinar tela de login (`/admin/login`) — sofisticação e sigilo

Atualizar **somente** `src/routes/admin.login.tsx`. Sem mudanças em backend, rotas ou outros arquivos.

### 1. Lado esquerdo (institucional) — remover qualquer pista do que é o sistema

- Remover o eyebrow `CAVALGADAS ENERGIAS DA TERRA`.
- Remover o título `Energias da Terra`.
- Remover o parágrafo `Painel operacional das expedições — onde a equipe orquestra reservas, participantes, contratos e a logística por trás de cada cavalgada.`
- Remover a lista dos 3 pilares (`Expedições selecionadas`, `Operação consolidada`, `Painel da equipe`).
- Substituir por uma marca tipográfica discreta e sofisticada, sem revelar o produto:
  - Eyebrow fino: `SISTEMA INTERNO` (dourado, tracking alto).
  - Marca: `Cavalgadas Energias da Terra` em display serif (apenas o nome da casa, sem descrever função).
  - Linha sutil de assinatura: `Ambiente restrito · Acesso autorizado`.
- Manter a foto de fundo (`loginHero`) e os overlays atuais.

### 2. Posição do cavalo na imagem de fundo

- Hoje a imagem usa `object-[center_58%]` (mobile) e `object-[center_55%]` (desktop), o que empurra o cavalo para baixo do viewport.
- Ajustar para `object-[center_72%]` / `lg:object-[center_70%]` (subir o enquadramento) para que a silhueta do cavalo e o horizonte fiquem visíveis e centralizados verticalmente no painel.
- Reforçar levemente o gradiente inferior para manter a legibilidade da marca tipográfica acima.

### 3. Lado direito (formulário) — copy mais sóbrio

- Manter o bloco de logo + “Painel interno / Cavalgadas”.
- Título: manter `Acesso ao painel`.
- Subtítulo: trocar
  - de: `Bem-vindo de volta. Insira suas credenciais para gerenciar as experiências da operação.`
  - para: `Insira suas credenciais para acessar o sistema interno.`
- Labels, inputs, checkbox `Manter conectado nesta sessão` e botão `Entrar no sistema` permanecem.

### 4. Rodapé do formulário — selos institucionais

Substituir os 3 selos:
- `Criptografia 256-bit` → `Sistema altamente criptografado`
- `Acesso monitorado` → mantém `Acesso monitorado`
- `Suporte interno` → mantém `Suporte interno`

(Mesmo estilo tipográfico atual: uppercase, tracking largo, cinza discreto.)

### 5. Validações

- Desktop (split 50/50): cavalo visível, sem textos descritivos, marca tipográfica centralizada à esquerda.
- Mobile (imagem no topo, form abaixo): cavalo aparece no enquadramento superior, marca discreta sobreposta, form intacto.
- Nenhuma alteração de lógica de auth, i18n, rotas ou tokens de design.

### Resumo técnico

Arquivo único: `src/routes/admin.login.tsx`
- Remoção do `<ul>` de pilares e dos textos descritivos no `<aside>`.
- Substituição do bloco de conteúdo institucional por marca tipográfica neutra.
- Ajuste das classes `object-position` no `<img>` de fundo.
- Atualização de 2 strings de copy (subtítulo + 1 selo do rodapé).
