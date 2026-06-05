-- Forçar etapa inicial 'novo' em qualquer novo lead (impede leads caindo direto em pronto_reserva)
ALTER TABLE public.leads ALTER COLUMN etapa_atendimento SET DEFAULT 'novo';

CREATE OR REPLACE FUNCTION public.lead_force_etapa_novo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Todo lead novo entra obrigatoriamente em 'novo'.
  -- A promoção pra outras etapas acontece via UPDATE (operador ou IA).
  NEW.etapa_atendimento := 'novo';
  NEW.status := 'novo';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_force_etapa_novo ON public.leads;
CREATE TRIGGER trg_lead_force_etapa_novo
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.lead_force_etapa_novo();