
-- ====== mensagens_canal ======
ALTER TABLE public.mensagens_canal
  ADD COLUMN IF NOT EXISTS participante_id uuid REFERENCES public.participantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS autor text NOT NULL DEFAULT 'cliente',
  ADD COLUMN IF NOT EXISTS lido boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lido_em timestamptz;

ALTER TABLE public.mensagens_canal
  DROP CONSTRAINT IF EXISTS mensagens_canal_autor_chk;
ALTER TABLE public.mensagens_canal
  ADD CONSTRAINT mensagens_canal_autor_chk
  CHECK (autor IN ('cliente','operador','ia','sistema'));

ALTER TABLE public.mensagens_canal
  DROP CONSTRAINT IF EXISTS mensagens_canal_canal_chk;
ALTER TABLE public.mensagens_canal
  ADD CONSTRAINT mensagens_canal_canal_chk
  CHECK (canal IN ('whatsapp','instagram','site','email','telefone','manual','outro'));

CREATE INDEX IF NOT EXISTS idx_mc_lead ON public.mensagens_canal(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_reserva ON public.mensagens_canal(reserva_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_canal ON public.mensagens_canal(canal);
CREATE INDEX IF NOT EXISTS idx_mc_busca ON public.mensagens_canal
  USING gin(to_tsvector('portuguese', coalesce(conteudo,'') || ' ' || coalesce(remetente,'') || ' ' || coalesce(destinatario,'')));

-- ====== ia_interacoes ======
ALTER TABLE public.ia_interacoes
  ADD COLUMN IF NOT EXISTS autor text NOT NULL DEFAULT 'ia',
  ADD COLUMN IF NOT EXISTS latencia_ms integer,
  ADD COLUMN IF NOT EXISTS contexto_usado jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS resposta_final text,
  ADD COLUMN IF NOT EXISTS motivo_handoff text,
  ADD COLUMN IF NOT EXISTS mensagem_id uuid REFERENCES public.mensagens_canal(id) ON DELETE SET NULL;

ALTER TABLE public.ia_interacoes
  DROP CONSTRAINT IF EXISTS ia_interacoes_autor_chk;
ALTER TABLE public.ia_interacoes
  ADD CONSTRAINT ia_interacoes_autor_chk
  CHECK (autor IN ('humano','ia','sistema'));

CREATE INDEX IF NOT EXISTS idx_iai_lead ON public.ia_interacoes(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iai_reserva ON public.ia_interacoes(reserva_id, created_at DESC);

-- ====== Timeline unificada ======
CREATE OR REPLACE VIEW public.vw_timeline_cliente AS
-- Mensagens
SELECT
  'mensagem'::text AS tipo,
  m.id            AS evento_id,
  m.lead_id,
  m.reserva_id,
  m.created_at    AS ocorrido_em,
  m.canal         AS canal,
  m.autor         AS autor,
  m.direcao       AS direcao,
  COALESCE(m.conteudo, '') AS titulo,
  NULL::text      AS detalhe,
  jsonb_build_object('remetente', m.remetente, 'destinatario', m.destinatario, 'status', m.status) AS metadata
FROM public.mensagens_canal m

UNION ALL
-- Interações IA (modo sombra/simulação)
SELECT
  'ia_interacao',
  i.id,
  i.lead_id,
  i.reserva_id,
  i.created_at,
  i.canal,
  i.autor,
  i.direcao,
  COALESCE(i.resposta_final, i.conteudo, ''),
  i.motivo_handoff,
  jsonb_build_object('modelo', i.modelo, 'confidence', i.confidence, 'intent', i.intent, 'latencia_ms', i.latencia_ms)
FROM public.ia_interacoes i

UNION ALL
-- Conversas do lead (etapas, temperatura, status, atendimento)
SELECT
  'lead_evento',
  c.id,
  c.lead_id,
  NULL::uuid,
  c.created_at,
  NULL::text,
  'sistema',
  NULL::text,
  COALESCE(c.tipo_evento, 'evento'),
  c.conteudo,
  COALESCE(c.metadata, '{}'::jsonb)
FROM public.lead_conversas c

UNION ALL
-- Histórico de reserva (status, financeiro, contrato, pagamentos)
SELECT
  'reserva_evento',
  h.id,
  r.lead_id,
  h.reserva_id,
  h.created_at,
  NULL::text,
  'sistema',
  NULL::text,
  h.tipo,
  h.descricao,
  COALESCE(h.metadata, '{}'::jsonb)
FROM public.reserva_historico h
LEFT JOIN public.reservas r ON r.id = h.reserva_id

UNION ALL
-- Pagamentos (criação/confirmação)
SELECT
  'pagamento',
  p.id,
  r.lead_id,
  p.reserva_id,
  p.created_at,
  p.forma,
  'sistema',
  NULL::text,
  p.tipo || ' · ' || COALESCE(p.moeda,'BRL') || ' ' || p.valor::text,
  p.status,
  jsonb_build_object('status', p.status, 'forma', p.forma, 'moeda', p.moeda, 'valor', p.valor)
FROM public.pagamentos p
LEFT JOIN public.reservas r ON r.id = p.reserva_id

UNION ALL
-- Tarefas
SELECT
  'tarefa',
  t.id,
  t.lead_id,
  t.reserva_id,
  t.created_at,
  NULL::text,
  'sistema',
  NULL::text,
  t.titulo,
  t.descricao,
  jsonb_build_object('status', t.status, 'prioridade', t.prioridade, 'tipo', t.tipo, 'due_at', t.due_at)
FROM public.tarefas t

UNION ALL
-- Handoff queue
SELECT
  'handoff',
  q.id,
  q.lead_id,
  q.reserva_id,
  q.criado_em,
  NULL::text,
  'sistema',
  NULL::text,
  'Handoff: ' || q.motivo,
  q.notas,
  jsonb_build_object('status', q.status, 'prioridade', q.prioridade, 'atribuido_para', q.atribuido_para, 'resolvido_em', q.resolvido_em)
FROM public.ia_handoff_queue q;

GRANT SELECT ON public.vw_timeline_cliente TO authenticated, service_role;

-- Grants (idempotentes)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens_canal TO authenticated;
GRANT ALL ON public.mensagens_canal TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_interacoes TO authenticated;
GRANT ALL ON public.ia_interacoes TO service_role;
