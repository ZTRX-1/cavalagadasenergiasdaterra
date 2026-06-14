
-- 1) Protocolo automático em leads
CREATE OR REPLACE FUNCTION public.tr_gerar_protocolo_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.protocolo IS NULL OR NEW.protocolo = '' THEN
    NEW.protocolo := public.gerar_protocolo_lead();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_gerar_protocolo_lead ON public.leads;
CREATE TRIGGER trg_gerar_protocolo_lead
BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.tr_gerar_protocolo_lead();

-- 2) Evolução automática de status_operacional na quitação
CREATE OR REPLACE FUNCTION public.pagamento_registrado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_pago numeric;
  v_valor_total numeric;
  v_moeda_reserva text;
  v_status text;
  v_status_anterior text;
  v_status_op_anterior text;
  v_tem_divergente boolean;
  v_novo_status_op text;
BEGIN
  SELECT moeda, valor_total, status_financeiro, status_operacional
    INTO v_moeda_reserva, v_valor_total, v_status_anterior, v_status_op_anterior
  FROM public.reservas WHERE id = NEW.reserva_id;

  IF TG_OP = 'INSERT' AND (NEW.moeda IS NULL OR NEW.moeda = '') THEN
    NEW.moeda := COALESCE(v_moeda_reserva, 'BRL');
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, valor, metadata)
    VALUES (NEW.reserva_id, 'pagamento',
      'Pagamento ' || NEW.tipo || ' (' || NEW.forma || '): ' || NEW.moeda || ' ' || NEW.valor::text,
      NEW.valor,
      jsonb_build_object('tipo', NEW.tipo, 'forma', NEW.forma, 'status', NEW.status, 'moeda', NEW.moeda));

    IF NEW.status = 'confirmado' AND NEW.tipo <> 'reembolso' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('pagamento_recebido','pagamento', NEW.id,
        jsonb_build_object('reserva_id', NEW.reserva_id, 'tipo', NEW.tipo, 'forma', NEW.forma, 'valor', NEW.valor, 'moeda', NEW.moeda));
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'confirmado' AND NEW.tipo <> 'reembolso' THEN
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('pagamento_recebido','pagamento', NEW.id,
      jsonb_build_object('reserva_id', NEW.reserva_id, 'tipo', NEW.tipo, 'forma', NEW.forma, 'valor', NEW.valor, 'moeda', NEW.moeda));
  END IF;

  SELECT COALESCE(SUM(valor), 0) INTO v_total_pago
  FROM public.pagamentos
  WHERE reserva_id = NEW.reserva_id
    AND status = 'confirmado'
    AND tipo <> 'reembolso'
    AND moeda = COALESCE(v_moeda_reserva,'BRL');

  SELECT EXISTS (
    SELECT 1 FROM public.pagamentos
    WHERE reserva_id = NEW.reserva_id
      AND status = 'confirmado'
      AND tipo <> 'reembolso'
      AND moeda <> COALESCE(v_moeda_reserva,'BRL')
  ) INTO v_tem_divergente;

  v_status := CASE
    WHEN v_valor_total IS NULL OR v_valor_total = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago >= v_valor_total THEN 'pago_integralmente'
    WHEN v_total_pago < v_valor_total THEN 'parcialmente_pago'
    ELSE 'aguardando_pagamento'
  END;

  -- Avança status_operacional: pre_reserva -> reserva_confirmada quando quitada
  v_novo_status_op := v_status_op_anterior;
  IF v_status = 'pago_integralmente'
     AND v_status_op_anterior IN ('pre_reserva','aguardando_pagamento') THEN
    v_novo_status_op := 'reserva_confirmada';
  END IF;

  UPDATE public.reservas
  SET valor_pago = v_total_pago,
      status_financeiro = v_status,
      status_operacional = v_novo_status_op,
      tem_pagamento_moeda_divergente = v_tem_divergente,
      updated_at = now()
  WHERE id = NEW.reserva_id;

  IF v_status = 'pago_integralmente' AND v_status_anterior IS DISTINCT FROM 'pago_integralmente' THEN
    UPDATE public.participantes
    SET status = 'confirmado', updated_at = now()
    WHERE reserva_id = NEW.reserva_id AND status <> 'confirmado';

    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.reserva_id, 'participantes_confirmados',
      'Reserva quitada — participantes marcados como confirmados',
      jsonb_build_object('total_pago', v_total_pago, 'moeda', v_moeda_reserva));
  END IF;

  RETURN NEW;
END $$;
