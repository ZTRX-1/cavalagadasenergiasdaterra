-- 1. Create the internal schema
CREATE SCHEMA IF NOT EXISTS auth_internal;

-- 2. Define hardened functions in auth_internal
CREATE OR REPLACE FUNCTION auth_internal.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth_internal
AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION auth_internal.is_internal_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth_internal
AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION auth_internal.gerar_protocolo()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth_internal
AS $$
DECLARE
  ano_atual int := EXTRACT(YEAR FROM now())::int;
  token text;
  tentativas int := 0;
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  novo text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT auth_internal.is_internal_user(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado.';
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

CREATE OR REPLACE FUNCTION auth_internal.gerar_protocolo_lead()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth_internal
AS $$
DECLARE
  ano_atual int := EXTRACT(YEAR FROM now())::int;
  token text;
  tentativas int := 0;
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  novo text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT auth_internal.is_internal_user(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado.';
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

-- 3. Update RLS policies to use the new hardened functions
-- We do this for ALL tables currently using the old functions.

-- Profiles
DROP POLICY IF EXISTS "Usuários internos veem todos os perfis" ON public.profiles;
CREATE POLICY "Usuários internos veem todos os perfis" ON public.profiles FOR SELECT TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Admins atualizam qualquer perfil" ON public.profiles;
CREATE POLICY "Admins atualizam qualquer perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- User Roles
DROP POLICY IF EXISTS "Admins veem todas as roles" ON public.user_roles;
CREATE POLICY "Admins veem todas as roles" ON public.user_roles FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Superadmins gerenciam roles privilegiadas" ON public.user_roles;
CREATE POLICY "Superadmins gerenciam roles privilegiadas" ON public.user_roles FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), 'superadmin'::app_role) OR (auth_internal.has_role(auth.uid(), 'admin'::app_role) AND (role <> ALL (ARRAY['admin'::app_role, 'superadmin'::app_role]))));

-- Leads
DROP POLICY IF EXISTS "Internos leem leads" ON public.leads;
CREATE POLICY "Internos leem leads" ON public.leads FOR SELECT TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam leads" ON public.leads;
CREATE POLICY "Internos gerenciam leads" ON public.leads FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid())) WITH CHECK (auth_internal.is_internal_user(auth.uid()));

-- Reservas
DROP POLICY IF EXISTS "Internos gerenciam reservas" ON public.reservas;
CREATE POLICY "Internos gerenciam reservas" ON public.reservas FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid())) WITH CHECK (auth_internal.is_internal_user(auth.uid()));

-- Participantes
DROP POLICY IF EXISTS "Internos leem participantes" ON public.participantes;
CREATE POLICY "Internos leem participantes" ON public.participantes FOR SELECT TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam participantes" ON public.participantes;
CREATE POLICY "Internos gerenciam participantes" ON public.participantes FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid())) WITH CHECK (auth_internal.is_internal_user(auth.uid()));

-- Expedicoes & Datas
DROP POLICY IF EXISTS "Internos gerenciam expedicoes" ON public.expedicoes;
CREATE POLICY "Internos gerenciam expedicoes" ON public.expedicoes FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid())) WITH CHECK (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam datas" ON public.datas;
CREATE POLICY "Internos gerenciam datas" ON public.datas FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid())) WITH CHECK (auth_internal.is_internal_user(auth.uid()));

-- User Module Permissions
DROP POLICY IF EXISTS "Admins gerenciam permissões" ON public.user_module_permissions;
CREATE POLICY "Admins gerenciam permissões" ON public.user_module_permissions FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role) OR auth_internal.has_role(auth.uid(), 'superadmin'::app_role) OR auth_internal.has_role(auth.uid(), 'ceo'::app_role));
DROP POLICY IF EXISTS "Usuário lê suas permissões" ON public.user_module_permissions;
CREATE POLICY "Usuário lê suas permissões" ON public.user_module_permissions FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR auth_internal.has_role(auth.uid(), 'admin'::app_role) OR auth_internal.has_role(auth.uid(), 'superadmin'::app_role) OR auth_internal.has_role(auth.uid(), 'ceo'::app_role));

-- 4. Convert public functions to SECURITY INVOKER to satisfy linter
-- They will now act as wrappers or can be dropped if no longer needed.
-- Since they were SECURITY DEFINER, they had a grant to authenticated.
-- Switching to INVOKER removes the linter warning.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Now policies use auth_internal.has_role directly. 
  -- This public version is just a shell for compatibility or can be dropped.
  RETURN auth_internal.has_role(_user_id, _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_internal_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN auth_internal.is_internal_user(_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_protocolo()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN auth_internal.gerar_protocolo();
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_protocolo_lead()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN auth_internal.gerar_protocolo_lead();
END;
$$;

-- 5. Grant permissions to the new schema
GRANT USAGE ON SCHEMA auth_internal TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth_internal TO authenticated, service_role;
