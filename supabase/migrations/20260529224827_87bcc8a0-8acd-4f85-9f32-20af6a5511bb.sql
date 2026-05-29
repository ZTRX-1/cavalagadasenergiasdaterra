-- Tabela de permissões por módulo
CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  modulo TEXT NOT NULL,
  pode_ver BOOLEAN NOT NULL DEFAULT false,
  pode_editar BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, modulo)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_module_permissions TO authenticated;
GRANT ALL ON public.user_module_permissions TO service_role;

ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê suas permissões"
  ON public.user_module_permissions FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'ceo')
  );

CREATE POLICY "Admins gerenciam permissões"
  ON public.user_module_permissions FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'ceo')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'ceo')
  );

CREATE TRIGGER trg_user_module_permissions_updated
  BEFORE UPDATE ON public.user_module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função: papel principal do usuário (maior privilégio)
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role::text
    WHEN 'superadmin' THEN 1
    WHEN 'admin'      THEN 2
    WHEN 'ceo'        THEN 3
    WHEN 'socia'      THEN 4
    WHEN 'operador'   THEN 5
    ELSE 99
  END
  LIMIT 1
$$;

-- Singleton de proteção do super admin
CREATE TABLE IF NOT EXISTS public.superadmin_protection (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  CONSTRAINT singleton_protection CHECK (id),
  password_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.superadmin_protection TO authenticated;
GRANT ALL ON public.superadmin_protection TO service_role;

ALTER TABLE public.superadmin_protection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos leem flag de proteção"
  ON public.superadmin_protection FOR SELECT TO authenticated
  USING (public.is_internal_user(auth.uid()));

INSERT INTO public.superadmin_protection (id) VALUES (true)
  ON CONFLICT (id) DO NOTHING;