-- 1. Revoke public execute on protocol functions (SECURITY 0028/0029)
REVOKE EXECUTE ON FUNCTION public.gerar_protocolo() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.gerar_protocolo_lead() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.gerar_protocolo() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.gerar_protocolo_lead() TO service_role, authenticated;

-- 2. Add explicit deny policy for anon on protocol counters
DROP POLICY IF EXISTS "Bloqueia acesso direto" ON public.protocolo_counter;
CREATE POLICY "Bloqueia acesso direto"
ON public.protocolo_counter
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Sem acesso direto protocolo_lead_counter" ON public.protocolo_lead_counter;
CREATE POLICY "Bloqueia acesso direto lead counter"
ON public.protocolo_lead_counter
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 3. Allow users to see their own profile (Data Protection)
DROP POLICY IF EXISTS "Usuários veem o próprio perfil" ON public.profiles;
CREATE POLICY "Usuários veem o próprio perfil"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
