
-- ===================== HANDOFF =====================
ALTER TABLE public.ia_handoff_queue
  ADD COLUMN IF NOT EXISTS responsavel_anterior uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS responsavel_atual uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'sistema',
  ADD COLUMN IF NOT EXISTS prazo timestamptz,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.ia_handoff_queue
  DROP CONSTRAINT IF EXISTS ia_handoff_origem_chk;
ALTER TABLE public.ia_handoff_queue
  ADD CONSTRAINT ia_handoff_origem_chk CHECK (origem IN ('humano','automacao','ia','sistema'));

ALTER TABLE public.ia_handoff_queue
  DROP CONSTRAINT IF EXISTS ia_handoff_status_chk;
ALTER TABLE public.ia_handoff_queue
  ADD CONSTRAINT ia_handoff_status_chk CHECK (status IN ('pendente','em_andamento','resolvido','cancelado'));

ALTER TABLE public.ia_handoff_queue
  DROP CONSTRAINT IF EXISTS ia_handoff_prioridade_chk;
ALTER TABLE public.ia_handoff_queue
  ADD CONSTRAINT ia_handoff_prioridade_chk CHECK (prioridade IN ('baixa','media','alta','critica'));

-- Trigger que atualiza atualizado_em e sincroniza responsavel_atual com atribuido_para
CREATE OR REPLACE FUNCTION public.tr_handoff_atualizar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.atualizado_em := now();
  IF TG_OP = 'UPDATE' THEN
    IF NEW.atribuido_para IS DISTINCT FROM OLD.atribuido_para THEN
      NEW.responsavel_anterior := OLD.atribuido_para;
      NEW.responsavel_atual := NEW.atribuido_para;
    END IF;
    IF NEW.status = 'resolvido' AND OLD.status <> 'resolvido' THEN
      NEW.resolvido_em := COALESCE(NEW.resolvido_em, now());
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.responsavel_atual := COALESCE(NEW.responsavel_atual, NEW.atribuido_para);
    -- SLA padrão por prioridade (em horas) se não informado
    IF NEW.prazo IS NULL THEN
      NEW.prazo := now() + CASE NEW.prioridade
        WHEN 'critica' THEN INTERVAL '2 hours'
        WHEN 'alta'    THEN INTERVAL '8 hours'
        WHEN 'media'   THEN INTERVAL '24 hours'
        ELSE                INTERVAL '72 hours'
      END;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_handoff_atualizar ON public.ia_handoff_queue;
CREATE TRIGGER trg_handoff_atualizar
  BEFORE INSERT OR UPDATE ON public.ia_handoff_queue
  FOR EACH ROW EXECUTE FUNCTION public.tr_handoff_atualizar();

-- View com status de SLA
CREATE OR REPLACE VIEW public.vw_handoffs_sla AS
SELECT
  q.*,
  CASE
    WHEN q.status = 'resolvido' THEN 'resolvido'
    WHEN q.prazo IS NOT NULL AND now() > q.prazo THEN 'atrasado'
    ELSE 'no_prazo'
  END AS sla_status,
  GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(q.resolvido_em, now()) - q.criado_em))) AS segundos_em_aberto
FROM public.ia_handoff_queue q;

ALTER VIEW public.vw_handoffs_sla SET (security_invoker = true);
GRANT SELECT ON public.vw_handoffs_sla TO authenticated, service_role;

-- ===================== TAREFAS =====================
ALTER TABLE public.tarefas
  ADD COLUMN IF NOT EXISTS participante_id uuid REFERENCES public.participantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expedicao_id uuid REFERENCES public.expedicoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'manual';

ALTER TABLE public.tarefas
  DROP CONSTRAINT IF EXISTS tarefas_origem_chk;
ALTER TABLE public.tarefas
  ADD CONSTRAINT tarefas_origem_chk CHECK (origem IN ('manual','automacao','ia','sistema'));

ALTER TABLE public.tarefas
  DROP CONSTRAINT IF EXISTS tarefas_status_chk;
ALTER TABLE public.tarefas
  ADD CONSTRAINT tarefas_status_chk CHECK (status IN ('aberta','em_andamento','concluida','cancelada'));

ALTER TABLE public.tarefas
  DROP CONSTRAINT IF EXISTS tarefas_prioridade_chk;
ALTER TABLE public.tarefas
  ADD CONSTRAINT tarefas_prioridade_chk CHECK (prioridade IN ('baixa','media','alta','critica'));

CREATE INDEX IF NOT EXISTS idx_tarefas_lead ON public.tarefas(lead_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_reserva ON public.tarefas(reserva_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_due ON public.tarefas(due_at);

-- Helper: cria tarefa se ainda não existir uma idêntica em aberto
CREATE OR REPLACE FUNCTION public.criar_tarefa_idempotente(
  p_titulo text, p_tipo text, p_origem text, p_prioridade text,
  p_lead uuid, p_reserva uuid, p_participante uuid, p_due interval
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.tarefas
   WHERE titulo = p_titulo
     AND status IN ('aberta','em_andamento')
     AND COALESCE(lead_id::text,'')        = COALESCE(p_lead::text,'')
     AND COALESCE(reserva_id::text,'')     = COALESCE(p_reserva::text,'')
     AND COALESCE(participante_id::text,'') = COALESCE(p_participante::text,'')
   LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  INSERT INTO public.tarefas (titulo, tipo, origem, prioridade, status, lead_id, reserva_id, participante_id, due_at)
  VALUES (p_titulo, p_tipo, p_origem, p_prioridade, 'aberta', p_lead, p_reserva, p_participante, now() + p_due)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Gatilho: reserva confirmada / pagamento integral
CREATE OR REPLACE FUNCTION public.tr_reserva_tarefas_auto()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status_operacional = 'reserva_confirmada'
     AND (OLD.status_operacional IS DISTINCT FROM 'reserva_confirmada') THEN
    PERFORM public.criar_tarefa_idempotente(
      'Enviar boas-vindas e instruções da expedição',
      'comunicacao','automacao','alta',
      NEW.lead_id, NEW.id, NULL, INTERVAL '24 hours');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_reserva_tarefas_auto ON public.reservas;
CREATE TRIGGER trg_reserva_tarefas_auto
  AFTER UPDATE OF status_operacional ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.tr_reserva_tarefas_auto();

-- Gatilho: pagamento confirmado
CREATE OR REPLACE FUNCTION public.tr_pagamento_tarefa_auto()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lead uuid;
BEGIN
  IF NEW.status = 'confirmado' AND NEW.tipo <> 'reembolso'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmado') THEN
    SELECT lead_id INTO v_lead FROM public.reservas WHERE id = NEW.reserva_id;
    PERFORM public.criar_tarefa_idempotente(
      'Confirmar recebimento e enviar recibo (' || NEW.moeda || ' ' || NEW.valor::text || ')',
      'financeiro','automacao','media',
      v_lead, NEW.reserva_id, NULL, INTERVAL '12 hours');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_pagamento_tarefa_auto ON public.pagamentos;
CREATE TRIGGER trg_pagamento_tarefa_auto
  AFTER INSERT OR UPDATE OF status ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.tr_pagamento_tarefa_auto();

-- Gatilho: participante sem peso ou sem experiência
CREATE OR REPLACE FUNCTION public.tr_participante_tarefa_auto()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lead uuid; v_falta text := '';
BEGIN
  IF NEW.peso IS NULL THEN v_falta := v_falta || 'peso'; END IF;
  IF NEW.experiencia_equestre IS NULL OR NEW.experiencia_equestre = '' THEN
    v_falta := v_falta || CASE WHEN v_falta = '' THEN '' ELSE ' e ' END || 'experiência equestre';
  END IF;
  IF v_falta = '' THEN RETURN NEW; END IF;
  SELECT lead_id INTO v_lead FROM public.reservas WHERE id = NEW.reserva_id;
  PERFORM public.criar_tarefa_idempotente(
    'Completar ficha do participante ' || COALESCE(NEW.nome,'(sem nome)') || ' — falta ' || v_falta,
    'operacional','automacao','media',
    v_lead, NEW.reserva_id, NEW.id, INTERVAL '48 hours');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_participante_tarefa_auto ON public.participantes;
CREATE TRIGGER trg_participante_tarefa_auto
  AFTER INSERT OR UPDATE OF peso, experiencia_equestre ON public.participantes
  FOR EACH ROW EXECUTE FUNCTION public.tr_participante_tarefa_auto();

-- ===================== CENTRAL DE ATENÇÃO =====================
CREATE OR REPLACE VIEW public.vw_central_atencao AS
-- Handoffs pendentes
SELECT
  'handoff'::text AS categoria,
  q.id AS item_id,
  q.lead_id, q.reserva_id,
  q.prioridade,
  q.criado_em AS ocorrido_em,
  q.prazo AS vence_em,
  CASE WHEN q.prazo IS NOT NULL AND now() > q.prazo THEN true ELSE false END AS atrasado,
  'Handoff: ' || q.motivo AS titulo
FROM public.ia_handoff_queue q
WHERE q.status IN ('pendente','em_andamento')

UNION ALL
-- Tarefas em aberto (com destaque para atrasadas)
SELECT 'tarefa', t.id, t.lead_id, t.reserva_id, t.prioridade,
       t.created_at, t.due_at,
       (t.due_at IS NOT NULL AND now() > t.due_at),
       t.titulo
FROM public.tarefas t
WHERE t.status IN ('aberta','em_andamento')

UNION ALL
-- Documentos pendentes
SELECT 'documento', d.id, d.lead_id, d.reserva_id, 'media',
       d.created_at, NULL::timestamptz, false,
       'Documento pendente: ' || COALESCE(d.titulo, d.categoria)
FROM public.documentos_central d
WHERE d.status IN ('pendente','solicitado','enviado')

UNION ALL
-- Pagamentos vencendo / atrasados
SELECT 'pagamento', p.id, r.lead_id, p.reserva_id,
       CASE WHEN p.data_prevista < CURRENT_DATE THEN 'alta' ELSE 'media' END,
       p.created_at, p.data_prevista::timestamptz,
       (p.data_prevista IS NOT NULL AND p.data_prevista < CURRENT_DATE),
       'Pagamento previsto: ' || p.tipo || ' ' || COALESCE(p.moeda,'BRL') || ' ' || p.valor::text
FROM public.pagamentos p
LEFT JOIN public.reservas r ON r.id = p.reserva_id
WHERE p.status = 'previsto'
  AND p.data_prevista IS NOT NULL
  AND p.data_prevista <= (CURRENT_DATE + INTERVAL '7 days')

UNION ALL
-- Reservas aguardando ação (sem contrato, sem pagamento)
SELECT 'reserva', r.id, r.lead_id, r.id,
       CASE WHEN r.status_financeiro = 'aguardando_pagamento' THEN 'alta' ELSE 'media' END,
       r.created_at, NULL::timestamptz, false,
       'Reserva ' || r.protocolo || ' aguardando ação ('
        || r.status_operacional || ' / ' || r.status_financeiro || ')'
FROM public.reservas r
WHERE r.status_operacional IN ('pre_reserva','aguardando_pagamento')
   OR (r.contrato_enviado = false AND r.status_operacional NOT IN ('cancelada','reembolsada','excluida'));

ALTER VIEW public.vw_central_atencao SET (security_invoker = true);
GRANT SELECT ON public.vw_central_atencao TO authenticated, service_role;

-- Grants base
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefas TO authenticated;
GRANT ALL ON public.tarefas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_handoff_queue TO authenticated;
GRANT ALL ON public.ia_handoff_queue TO service_role;
