
-- Reserva: adicionar eventos contrato_enviado, contrato_assinado, reserva_confirmada
CREATE OR REPLACE FUNCTION public.reserva_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.id, 'criacao', 'Reserva criada: ' || NEW.protocolo,
      jsonb_build_object('protocolo', NEW.protocolo, 'expedicao', NEW.expedicao_nome));
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('reserva_criada', 'reserva', NEW.id,
      jsonb_build_object('protocolo', NEW.protocolo, 'expedicao_id', NEW.expedicao_id, 'valor_total', NEW.valor_total));
    RETURN NEW;
  END IF;

  IF NEW.status_financeiro IS DISTINCT FROM OLD.status_financeiro THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.id, 'status_financeiro',
      'Status financeiro: ' || OLD.status_financeiro || ' → ' || NEW.status_financeiro,
      jsonb_build_object('de', OLD.status_financeiro, 'para', NEW.status_financeiro));

    IF NEW.status_financeiro = 'pago_integralmente' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('pagamento_confirmado', 'reserva', NEW.id,
        jsonb_build_object('protocolo', NEW.protocolo, 'valor_pago', NEW.valor_pago));
    END IF;
  END IF;

  IF NEW.status_operacional IS DISTINCT FROM OLD.status_operacional THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.id, 'status_operacional',
      'Status operacional: ' || OLD.status_operacional || ' → ' || NEW.status_operacional,
      jsonb_build_object('de', OLD.status_operacional, 'para', NEW.status_operacional));

    IF NEW.status_operacional = 'reserva_confirmada' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('reserva_confirmada', 'reserva', NEW.id,
        jsonb_build_object('protocolo', NEW.protocolo, 'expedicao_id', NEW.expedicao_id));
    END IF;
  END IF;

  IF NEW.contrato_enviado IS DISTINCT FROM OLD.contrato_enviado AND NEW.contrato_enviado THEN
    NEW.contrato_enviado_em := COALESCE(NEW.contrato_enviado_em, now());
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao)
    VALUES (NEW.id, 'contrato', 'Contrato enviado ao cliente');
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('contrato_enviado', 'reserva', NEW.id,
      jsonb_build_object('protocolo', NEW.protocolo));
  END IF;

  IF NEW.contrato_assinado IS DISTINCT FROM OLD.contrato_assinado AND NEW.contrato_assinado THEN
    NEW.contrato_assinado_em := COALESCE(NEW.contrato_assinado_em, now());
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao)
    VALUES (NEW.id, 'contrato', 'Contrato assinado pelo cliente');
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('contrato_assinado', 'reserva', NEW.id,
      jsonb_build_object('protocolo', NEW.protocolo));
  END IF;

  RETURN NEW;
END;
$function$;

-- Pagamento: adicionar evento pagamento_recebido para cada pagamento confirmado
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

  SELECT valor_total INTO v_valor_total FROM public.reservas WHERE id = NEW.reserva_id;

  v_status := CASE
    WHEN v_valor_total IS NULL OR v_valor_total = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago >= v_valor_total THEN 'pago_integralmente'
    WHEN v_total_pago < v_valor_total THEN 'parcialmente_pago'
    ELSE 'aguardando_pagamento'
  END;

  UPDATE public.reservas
  SET valor_pago = v_total_pago,
      saldo_restante = COALESCE(v_valor_total,0) - v_total_pago,
      status_financeiro = v_status,
      updated_at = now()
  WHERE id = NEW.reserva_id;

  RETURN NEW;
END;
$function$;

-- Garantir trigger UPDATE em pagamentos (caso só exista INSERT)
DROP TRIGGER IF EXISTS trg_pagamento_registrado ON public.pagamentos;
CREATE TRIGGER trg_pagamento_registrado
AFTER INSERT OR UPDATE ON public.pagamentos
FOR EACH ROW
EXECUTE FUNCTION public.pagamento_registrado();
