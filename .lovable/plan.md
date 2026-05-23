
# Refino Cavalgadas Energias da Terra — Rodada 2

Objetivo: tirar a "cara de IA", garantir que a pré-reserva funcione ponta-a-ponta e alinhar a estrutura ao fluxo do concorrente, com design original e mobile impecável.

## Ordem de execução (mesma ordem de prioridade que você definiu)

### 1. Pré-reserva ponta-a-ponta + WhatsApp (prioridade máxima)
Antes de qualquer cosmética, valido o fluxo crítico:
- Reabro `src/routes/reserva.$slug.tsx` e `src/lib/reservas.functions.ts` e testo o caminho completo: form → `createServerFn` → `INSERT` em `reservas` → `gerar_protocolo()` → retorno do protocolo → redirect WhatsApp.
- Corrijo qualquer falha do schema Zod (responsável, participantes, aceites jurídicos) e adiciono mensagens de erro pt-BR claras.
- Garanto persistência de: protocolo, responsável (jsonb), participantes (jsonb), adicionais, aceites, `expedicao_id`, `data_id`, `expedicao_nome`, `data_label`, `quantidade_participantes`, `status='pre_reserva_enviada'`.
- Padronizo a mensagem do WhatsApp em `src/lib/whatsapp.ts` com o texto exato que você passou (nome, expedição, data, participantes, protocolo) e o número **+55 11 94162-6907** (`wa.me/5511941626907`).
- Tela de confirmação (passo 5) mostra protocolo grande, copy "Salvamos sua pré-reserva", botão primário "Abrir WhatsApp" e secundário "Consultar minha reserva".
- Verifico via `supabase--read_query` que o registro entra realmente na tabela após teste no preview.

### 2. Header sticky sólido + logo + drawer mobile premium
- Remoção da transparência: `bg-background/95 backdrop-blur-md` permanente desde o topo (sem variar com scroll), borda inferior sutil `border-border/40`, sombra leve ao rolar.
- Logo oficial sempre visível (ver seção "Assets reais" abaixo). Altura 40px desktop / 32px mobile, com fallback wordmark caso o asset ainda não esteja anexado.
- Contraste fixo: links em `text-foreground`, ativo em `text-cobre`, sem dependência de hero claro/escuro.
- CTA "Pré-reserva" sempre visível no header desktop (botão sólido `bg-cobre`).
- Drawer mobile: slide lateral full-height com overlay escuro, links grandes em `font-display`, divisor sutil, CTA WhatsApp no rodapé do drawer, fecha ao clicar fora e ao trocar de rota.
- Padding do hero compensado para não ficar sob o header.

### 3. Refino visual — menos "IA", mais rústico premium
- Tipografia: trocar Fraunces (display) por **Cormorant Garamond** ou **Tenor Sans** (mais editorial, menos "AI default"); manter Inter no body mas reduzir kerning excessivo dos eyebrows.
- Paleta: reforçar tons orgânicos — verde-musgo profundo, areia tostada, couro envelhecido, cobre fosco; remover qualquer brilho/gradient sintético, substituir por gradientes terrosos suaves.
- Texturas sutis: papel/linho em fundos `bg-secondary`, separadores com filete `border-cobre/30`, números das seções desenhados (não bold puro).
- Cards: cantos `rounded-sm` (não `rounded-2xl`), bordas finas em terra-clara, hover com elevação discreta + zoom 1.03 na imagem.
- Microcopy revisada: tom "expedição", não "experiência tech". Eyebrows curtos, sem palavras genéricas tipo "premium" duplicadas.
- Substituir ícones lucide "techy" (Sparkles, Compass) por glifos mais artesanais quando possível (lucide alternatives: TreePine, Flame, Mountain, Tent, Coffee, MapPin).
- Imagens reais (Instagram) substituem 100% das atuais geradas por IA (ver seção "Assets reais").

### 4. Paridade estrutural com o concorrente, página a página

**Home** (`/`)
- Hero com imagem real + headline + 2 CTAs (Expedições / Datas) — já existe, refinar tipografia e overlay.
- Faixa "O que está incluso" com 6 ícones rústicos.
- Grid de expedições (cards com imagem real, nome, duração, nível, preço, CTA).
- Bloco "Próximas datas" (4 cards horizontais).
- "Como funciona a reserva" em 4 passos.
- Depoimentos reais (aguardando você enviar; mantenho 3 placeholders nomeados).
- CTA final cinematográfico.

**Expedições** (`/expedicoes`)
- Header da página com eyebrow + intro curta.
- Grid responsivo (1 / 2 / 3 colunas), filtro simples por nível (iniciante / intermediário / avançado).
- Cards: imagem real, nome, descrição curta, duração, nível com badge, preço "a partir de", botão "Ver detalhes".

**Detalhes da expedição** (`/expedicoes/$slug`)
- Hero com galeria (carrossel mobile, grid desktop).
- Resumo lateral fixo (mobile: sticky bottom bar) com preço, duração, nível, CTA "Pré-reservar".
- Blocos: descrição longa, roteiro dia-a-dia, o que inclui, requisitos, próximas datas dessa expedição, FAQ contextual.

**Próximas Datas** (`/datas`)
- Agrupado por **mês** (igual concorrente).
- Linha por data: período (dd/mm – dd/mm), nome da expedição, vagas restantes, status (`Disponível` / `Últimas vagas` / `Esgotado`), botão "Reservar" desabilitado quando esgotado.
- Filtro por expedição no topo.

**Pré-reserva** (`/reserva/$slug`)
- 5 passos com indicador de progresso refinado (linha + dots), cada passo respira (mobile-first com 1 campo por linha).
- Passos: Responsável → Participantes (lista dinâmica) → Adicionais (transfer, observações, restrições) → Aceite jurídico (3 checkboxes obrigatórios) → Confirmação.
- Validação em tempo real, botões "Voltar / Continuar" fixos no rodapé mobile.
- Resumo lateral persistente: expedição, data, qtd, preço estimado.

**Minha Reserva** (`/minha-reserva`)
- Campo único para protocolo (`CET-2025-XXX`) + botão Consultar.
- Resultado: nome do responsável, expedição, data, status colorido, botão grande "Falar no WhatsApp" com mensagem pré-preenchida usando o protocolo.

**Contato / FAQ / Quem Somos** (`/contato`)
- Bloco "Quem somos" curto com foto real da equipe (do Instagram).
- FAQ em accordion.
- Contato: WhatsApp (CTA principal), e-mail, Instagram, localização base.

### 5. Mobile-first impecável
- Auditoria em 360, 390 e 414px de largura: tipografia escalar, espaçamentos comprimidos, CTAs sempre acima da dobra, bottom sheet de reserva em telas pequenas.
- `WhatsappFloat` reposicionado para não cobrir CTAs (offset acima do bottom bar quando existir).
- Teste navegação completa via `browser--navigate_to_sandbox` em viewport mobile antes de fechar.

## Assets reais — como vou lidar

**Logos (você enviará 4):** assim que você anexar na próxima mensagem, escolho a que melhor casa com o resto da identidade (peso, traço, legibilidade em fundo claro e escuro), gero versões otimizadas (PNG + variante monocromática para o footer escuro) e aplico em header, footer, favicon e og:image. Até lá uso o wordmark tipográfico atual como fallback.

**Fotos do Instagram (@cavalgadasenergiasdaterra):** o Instagram bloqueia scraping anônimo, então o caminho confiável é:
1. Tento via Firecrawl (`scrape` + `branding`) na URL pública do perfil para puxar metadados, mas é provável que retorne só a página de login.
2. Plano B (recomendado): você baixa 10–15 fotos do Instagram (cavalos, cavaleiros em trilha, paisagem da Canastra/Cipó/Chapada, acampamento, gastronomia, equipe) e anexa aqui em 1 mensagem. Eu nomeio, otimizo (`bun add` de `sharp` no build se necessário, ou apenas reencodo) e mapeio em `src/lib/expedicao-images.ts`.
3. Até as fotos reais chegarem, mantenho as IA atuais mas marcadas internamente como placeholder, para troca em batch.

## Detalhes técnicos

**Banco de dados:** estrutura atual (`expedicoes`, `datas`, `reservas`, `protocolo_counter`) está adequada. Sem migrações nesta rodada, salvo:
- Adicionar coluna `whatsapp_enviado_em timestamptz` em `reservas` (opcional, para futura analytics) — só se você confirmar.
- Garantir que `protocolo_counter` está com RLS habilitado mesmo sem policies (acesso só via função `SECURITY DEFINER`).

**Arquivos que vou editar/criar:**
- `src/components/site-header.tsx` (rewrite, header sólido + drawer)
- `src/components/site-footer.tsx` (logo + contato)
- `src/components/whatsapp-float.tsx` (posicionamento)
- `src/components/expedicao-card.tsx`, `data-card.tsx` (refino visual)
- `src/styles.css` (paleta + tipografia + texturas)
- `src/routes/index.tsx`, `expedicoes.tsx`, `expedicoes.$slug.tsx`, `datas.tsx`, `reserva.$slug.tsx`, `minha-reserva.tsx`, `contato.tsx` (refino seção a seção)
- `src/lib/reservas.functions.ts`, `src/lib/whatsapp.ts` (blindagem do fluxo)
- `src/lib/expedicao-images.ts` (mapeamento das fotos reais quando chegarem)
- `src/assets/` (logo + fotos novas)

**Sem alterar:** `src/integrations/supabase/*`, `src/routeTree.gen.ts`, `.env`, `supabase/config.toml`.

## QA final antes de entregar
1. `browser--navigate_to_sandbox` em desktop (1366) e mobile (390): home, expedições, detalhe, datas, reserva completa, minha reserva, contato.
2. `supabase--read_query` para confirmar que a reserva de teste foi gravada com todos os campos.
3. Verificar que o link do WhatsApp abre com a mensagem exata no formato pedido.
4. Checar header em todas as páginas (sem transparência, sem perda de contraste).
5. Console e network limpos.

## Próximo passo dependente de você
Para destravar 100% do refino visual eu preciso, na sua próxima mensagem:
- Anexar os **4 logos** (escolho e aplico).
- Anexar **10–15 fotos reais** do Instagram (ou confirmar que posso seguir só com a logo e refinar as fotos numa rodada 3).

Se topa, ao aprovar o plano eu já começo pelo passo 1 (pré-reserva + WhatsApp), que não depende dos assets, e integro logo + fotos assim que chegarem.
