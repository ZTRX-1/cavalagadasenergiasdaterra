
CREATE OR REPLACE FUNCTION public.tr_herdar_moeda_pagamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_moeda text;
BEGIN
  IF NEW.moeda IS NULL OR NEW.moeda = '' THEN
    SELECT moeda INTO v_moeda FROM public.reservas WHERE id = NEW.reserva_id;
    NEW.moeda := COALESCE(NULLIF(v_moeda,''), 'BRL');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_pagamento_herdar_moeda ON public.pagamentos;
CREATE TRIGGER trg_pagamento_herdar_moeda
BEFORE INSERT ON public.pagamentos
FOR EACH ROW EXECUTE FUNCTION public.tr_herdar_moeda_pagamento();
