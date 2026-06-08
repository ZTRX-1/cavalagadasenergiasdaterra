-- 1. Secure gerar_protocolo functions
-- These need to be SECURITY DEFINER to check uniqueness across all rows, 
-- but we should restrict who can call them.

CREATE OR REPLACE FUNCTION public.gerar_protocolo()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano_atual int := EXTRACT(YEAR FROM now())::int;
  token text;
  tentativas int := 0;
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  novo text;
BEGIN
  -- Security check: only internal users or service_role can call this directly
  IF auth.role() <> 'service_role' AND NOT public.is_internal_user(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas usuários internos podem gerar protocolos.';
  END IF;

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
$$;

CREATE OR REPLACE FUNCTION public.gerar_protocolo_lead()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano_atual int := EXTRACT(YEAR FROM now())::int;
  token text;
  tentativas int := 0;
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  novo text;
BEGIN
  -- Security check: only internal users or service_role can call this directly
  IF auth.role() <> 'service_role' AND NOT public.is_internal_user(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas usuários internos podem gerar protocolos de lead.';
  END IF;

  LOOP
    token := '';
    FOR i IN 1..6 LOOP
      token := token || substr(alfabeto, (floor(random() * length(alfabeto))::int) + 1, 1);
    END LOOP;
    novo := 'LEAD-' || ano_atual::text || '-' || token;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.leads WHERE protocolo = novo);
    tentativas := tentativas + 1;
    IF tentativas > 20 THEN
      RAISE EXCEPTION 'Não foi possível gerar protocolo lead único';
    END IF;
  END LOOP;
  RETURN novo;
END;
$$;

-- 2. Convert RLS helper functions to SECURITY DEFINER
-- This avoids recursion and is the standard secure way to implement role checks in policies.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_internal_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','operador','financeiro','midia','operacional','atendimento','superadmin','ceo','socia','desenvolvedor','ceo_preview')
  );
END;
$$;

-- 3. Revoke/Grant permissions explicitly
REVOKE EXECUTE ON FUNCTION public.gerar_protocolo() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.gerar_protocolo_lead() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_internal_user(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.gerar_protocolo() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.gerar_protocolo_lead() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_internal_user(uuid) TO authenticated, service_role;
