-- 1. Switch has_role to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- We don't need the owner/admin check anymore because RLS on user_roles will handle it
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 2. Switch is_internal_user to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.is_internal_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
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

-- 3. Switch get_primary_role to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role::text FROM public.user_roles
    WHERE user_id = _user_id
    ORDER BY CASE role::text
      WHEN 'desenvolvedor' THEN 0
      WHEN 'superadmin'    THEN 1
      WHEN 'admin'         THEN 2
      WHEN 'ceo'           THEN 3
      WHEN 'ceo_preview'   THEN 4
      WHEN 'socia'         THEN 5
      WHEN 'operador'      THEN 6
      ELSE 99
    END
    LIMIT 1
  );
END;
$$;
