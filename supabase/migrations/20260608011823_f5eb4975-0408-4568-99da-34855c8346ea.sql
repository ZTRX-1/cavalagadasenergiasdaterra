-- Update has_role to be safer
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow users to check their own role OR admins to check any role
  IF auth.uid() = _user_id OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'desenvolvedor')
  ) THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;

  RETURN FALSE;
END;
$$;

-- Update is_internal_user to be safer
CREATE OR REPLACE FUNCTION public.is_internal_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow users to check their own status OR admins to check any user
  IF auth.uid() = _user_id OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'desenvolvedor')
  ) THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
      AND role IN ('admin','operador','financeiro','midia','operacional','atendimento','superadmin','ceo','socia','desenvolvedor','ceo_preview')
    );
  END IF;

  RETURN FALSE;
END;
$$;

-- Update get_primary_role to be safer
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow users to get their own role OR admins to get any role
  IF auth.uid() = _user_id OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'desenvolvedor')
  ) THEN
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
  END IF;

  RETURN NULL;
END;
$$;
