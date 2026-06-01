-- Substitui gerador de protocolo de reservas por token aleatório não sequencial
CREATE OR REPLACE FUNCTION public.gerar_protocolo()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ano_atual int := EXTRACT(YEAR FROM now())::int;
  token text;
  tentativas int := 0;
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  novo text;
BEGIN
  LOOP
    token := '';
    FOR i IN 1..6 LOOP
      token := token || substr(alfabeto, (floor(random() * length(alfabeto))::int) + 1, 1);
    END LOOP;
    novo := 'CET-' || ano_atual::text || '-' || token;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.reservas WHERE protocolo = novo);
    tentativas := tentativas + 1;
    IF tentativas > 20 THEN
      RAISE EXCEPTION 'Não foi possível gerar protocolo único';
    END IF;
  END LOOP;
  RETURN novo;
END;
$function$;