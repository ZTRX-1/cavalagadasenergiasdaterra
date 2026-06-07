CREATE OR REPLACE FUNCTION public.pagamento_registrado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_pago numeric;
  v_valor_total numeric;
  v_status text;
  v_status_anterior text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, valor, metadata)
    VALUES (NEW.reserva_id, 'pagamento',
      'Pagamento ' || NEW.tipo || ' (' || NEW.forma || '): R$ ' || NEW.valor::text,
      NEW.valor,
      jsonb_build_object('tipo', NEW.tipo, 'forma', NEW.forma, 'status', NEW.status));

    IF NEW.status = 'confirmado' AND NEW.tipo <> 'reembolso' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('pagamento_recebido', 'pagamento', NEW.id,
        jsonb_build_object('reserva_id', NEW.reserva_id, 'tipo', NEW.tipo, 'forma', NEW.forma, 'valor', NEW.valor));
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'confirmado' AND NEW.tipo <> 'reembolso' THEN
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('pagamento_recebido', 'pagamento', NEW.id,
      jsonb_build_object('reserva_id', NEW.reserva_id, 'tipo', NEW.tipo, 'forma', NEW.forma, 'valor', NEW.valor));
  END IF;

  SELECT COALESCE(SUM(valor), 0) INTO v_total_pago
  FROM public.pagamentos
  WHERE reserva_id = NEW.reserva_id AND status = 'confirmado' AND tipo <> 'reembolso';

  SELECT valor_total, status_financeiro INTO v_valor_total, v_status_anterior
  FROM public.reservas WHERE id = NEW.reserva_id;

  v_status := CASE
    WHEN v_valor_total IS NULL OR v_valor_total = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago >= v_valor_total THEN 'pago_integralmente'
    WHEN v_total_pago < v_valor_total THEN 'parcialmente_pago'
    ELSE 'aguardando_pagamento'
  END;

  -- saldo_restante é coluna GERADA (valor_total - valor_pago); não atualizar diretamente
  UPDATE public.reservas
  SET valor_pago = v_total_pago,
      status_financeiro = v_status,
      updated_at = now()
  WHERE id = NEW.reserva_id;

  IF v_status = 'pago_integralmente' AND v_status_anterior IS DISTINCT FROM 'pago_integralmente' THEN
    UPDATE public.participantes
    SET status = 'confirmado', updated_at = now()
    WHERE reserva_id = NEW.reserva_id AND status <> 'confirmado';

    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.reserva_id, 'participantes_confirmados',
      'Reserva quitada — participantes marcados como confirmados',
      jsonb_build_object('total_pago', v_total_pago));
  END IF;

  RETURN NEW;
END;
$function$;