
-- 1. Backfill: garantir que todo usuário existente tenha algum papel interno.
--    O usuário mais antigo (provavelmente o fundador) vira admin; demais ficam operador.
DO $$
DECLARE
  primeiro uuid;
BEGIN
  SELECT id INTO primeiro
  FROM auth.users
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.users.id)
  ORDER BY created_at ASC
  LIMIT 1;

  IF primeiro IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (primeiro, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Os demais (se houver) recebem operador.
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id, 'operador'::app_role
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 2. Função de trigger: novo usuário ganha papel automaticamente.
CREATE OR REPLACE FUNCTION public.handle_new_internal_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total int;
BEGIN
  SELECT COUNT(*) INTO total FROM public.user_roles;
  IF total = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'operador')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger em auth.users (executado após o handle_new_user que cria o profile).
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_internal_user();
