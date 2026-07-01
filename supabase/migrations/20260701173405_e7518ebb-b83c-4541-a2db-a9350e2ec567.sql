
-- 1) PRIVILEGE ESCALATION: impedir alteração do próprio role em profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth_internal
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT auth_internal.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Não é permitido alterar o campo role do próprio perfil.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_self_update ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_self_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_self_update();

-- 2) internal_messages: restringir a usuários internos
DROP POLICY IF EXISTS "Users can send messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can view their own sent/received messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can update their own received messages" ON public.internal_messages;

CREATE POLICY "Internos podem enviar mensagens"
ON public.internal_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND auth_internal.is_internal_user(auth.uid())
  AND auth_internal.is_internal_user(recipient_id)
);

CREATE POLICY "Internos leem próprias mensagens"
ON public.internal_messages
FOR SELECT
TO authenticated
USING (
  auth_internal.is_internal_user(auth.uid())
  AND (auth.uid() = sender_id OR auth.uid() = recipient_id)
);

CREATE POLICY "Internos atualizam próprias mensagens"
ON public.internal_messages
FOR UPDATE
TO authenticated
USING (
  auth_internal.is_internal_user(auth.uid())
  AND (auth.uid() = sender_id OR auth.uid() = recipient_id)
)
WITH CHECK (
  auth_internal.is_internal_user(auth.uid())
);

-- 3) page_views: restringir INSERT a usuários internos
DROP POLICY IF EXISTS "Apenas usuários autenticados inserem page_views" ON public.page_views;

CREATE POLICY "Internos inserem page_views"
ON public.page_views
FOR INSERT
TO authenticated
WITH CHECK (
  auth_internal.is_internal_user(auth.uid())
  AND path IS NOT NULL
);

-- 4) Security Definer Views: converter para security_invoker
ALTER VIEW IF EXISTS public.vw_leads_pos_expedicao SET (security_invoker = on);
ALTER VIEW IF EXISTS public.vw_leads_reativacao   SET (security_invoker = on);

-- 5) Funções com search_path mutável: fixar search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public._ia_normalizar_telefone(text) SET search_path = public;
