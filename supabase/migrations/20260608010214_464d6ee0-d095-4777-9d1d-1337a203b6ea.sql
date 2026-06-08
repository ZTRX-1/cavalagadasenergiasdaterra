
-- 1. Restrict is_internal_user to specific internal roles (privilege escalation fix)
CREATE OR REPLACE FUNCTION public.is_internal_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','operador','financeiro','midia','operacional','atendimento','superadmin','ceo','socia','desenvolvedor','ceo_preview')
  )
$function$;

-- 2. Remove auto-role trigger that grants every new auth user 'operador'.
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- (Keep function for first-admin bootstrap path if needed, but no trigger fires it.)

-- 3. Tighten user_roles policies so only superadmin can grant admin/superadmin
DROP POLICY IF EXISTS "Admins gerenciam roles" ON public.user_roles;

CREATE POLICY "Superadmins gerenciam roles privilegiadas"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR (
    public.has_role(auth.uid(), 'admin')
    AND role NOT IN ('admin','superadmin')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin')
  OR (
    public.has_role(auth.uid(), 'admin')
    AND role NOT IN ('admin','superadmin')
  )
);

-- 4. Restrict superadmin_protection SELECT to superadmin only
DROP POLICY IF EXISTS "Internos leem flag de proteção" ON public.superadmin_protection;
CREATE POLICY "Apenas superadmin lê flag de proteção"
ON public.superadmin_protection
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- 5. protocolo_counter: explicit deny policy (accessed only via SECURITY DEFINER fns)
CREATE POLICY "Bloqueia acesso direto"
ON public.protocolo_counter
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 6. expedicao_indicadores: switch to security_invoker so RLS of querying user applies
ALTER VIEW public.expedicao_indicadores SET (security_invoker = on);
