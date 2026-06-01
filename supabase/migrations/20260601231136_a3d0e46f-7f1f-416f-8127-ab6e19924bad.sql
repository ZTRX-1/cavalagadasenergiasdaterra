
CREATE OR REPLACE FUNCTION public.lead_conversa_inserida()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Evita recursão: se a conversa foi inserida de dentro de um trigger
  -- na própria tabela leads, não tentar atualizar o mesmo registro novamente
  -- (causaria "tuple already modified by current command").
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  UPDATE public.leads
  SET ultima_interacao_at = NEW.created_at
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$function$;
