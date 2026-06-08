-- 1. Harden is_internal_user to prevent probing other users
CREATE OR REPLACE FUNCTION public.is_internal_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: users can only check their own internal status
  -- unless the caller is already an internal user or using service_role.
  -- This prevents unauthorized probing of user roles via direct RPC.
  IF auth.uid() <> _user_id 
     AND auth.role() <> 'service_role' 
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid()
         AND role IN ('admin','superadmin','desenvolvedor','ceo','socia')
     ) 
  THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','operador','financeiro','midia','operacional','atendimento','superadmin','ceo','socia','desenvolvedor','ceo_preview')
  );
END;
$$;

-- 2. Harden has_role to prevent probing other users
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: users can only check their own roles
  -- unless the caller is already an admin/superadmin or using service_role.
  IF auth.uid() <> _user_id 
     AND auth.role() <> 'service_role' 
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid()
         AND role IN ('admin','superadmin','desenvolvedor','ceo','socia')
     ) 
  THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;
