-- 1) Reforço de integridade em participantes (Peso)
ALTER TABLE public.participantes
  DROP CONSTRAINT IF EXISTS participantes_peso_chk,
  ADD CONSTRAINT participantes_peso_chk CHECK (peso > 0 AND peso <= 110);

-- Trigger para validar idade mínima de 8 anos
CREATE OR REPLACE FUNCTION public.trg_validar_participante_idade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (NEW.data_nascimento > (CURRENT_DATE - INTERVAL '8 years')) THEN
    RAISE EXCEPTION 'Idade mínima permitida é 8 anos.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validar_participante_idade_trg ON public.participantes;
CREATE TRIGGER validar_participante_idade_trg
  BEFORE INSERT OR UPDATE ON public.participantes
  FOR EACH ROW EXECUTE FUNCTION public.trg_validar_participante_idade();

-- 2) Histórico Imutável Automático (Reserva)
CREATE OR REPLACE FUNCTION public.trg_log_reserva_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.id, 'status', 'Status alterado de ' || OLD.status || ' para ' || NEW.status, jsonb_build_object('de', OLD.status, 'para', NEW.status));
  END IF;

  IF (OLD.valor_total IS DISTINCT FROM NEW.valor_total) THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.id, 'financeiro', 'Valor total alterado de ' || OLD.valor_total || ' para ' || NEW.valor_total, jsonb_build_object('de', OLD.valor_total, 'para', NEW.valor_total));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_reserva_changes_trg ON public.reservas;
CREATE TRIGGER log_reserva_changes_trg
  AFTER UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_reserva_changes();

-- 3) Auditoria de integridade (Check de saúde)
CREATE OR REPLACE FUNCTION public.check_crm_health()
RETURNS TABLE(issue text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Reservas sem lead'::text, count(*) FROM public.reservas WHERE lead_id IS NULL
  UNION ALL
  SELECT 'Participantes sem reserva'::text, count(*) FROM public.participantes WHERE reserva_id IS NULL
  UNION ALL
  SELECT 'Leads sem protocolo'::text, count(*) FROM public.leads WHERE protocolo IS NULL AND created_at > (now() - interval '7 days');
END;
$$ LANGUAGE plpgsql;
