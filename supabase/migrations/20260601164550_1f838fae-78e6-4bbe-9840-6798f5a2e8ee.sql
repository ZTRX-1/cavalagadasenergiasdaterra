
-- ============ CARGOS ============
CREATE TABLE IF NOT EXISTS public.cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  cor text,
  protegido boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos TO authenticated;
GRANT ALL ON public.cargos TO service_role;

ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos leem cargos"
  ON public.cargos FOR SELECT TO authenticated
  USING (is_internal_user(auth.uid()));

CREATE POLICY "Admins gerenciam cargos"
  ON public.cargos FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR has_role(auth.uid(), 'desenvolvedor'::app_role)
    OR has_role(auth.uid(), 'ceo'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR has_role(auth.uid(), 'desenvolvedor'::app_role)
    OR has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE TRIGGER trg_cargos_updated_at
  BEFORE UPDATE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Protege cargo Developer
CREATE OR REPLACE FUNCTION public.protect_cargo_developer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.chave = 'developer' THEN
    RAISE EXCEPTION 'O cargo Developer é protegido e não pode ser excluído.';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.chave = 'developer' THEN
    IF NEW.ativo = false THEN
      RAISE EXCEPTION 'O cargo Developer não pode ser desativado.';
    END IF;
    IF NEW.chave <> 'developer' THEN
      RAISE EXCEPTION 'A chave do cargo Developer não pode ser alterada.';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_protect_cargo_developer
  BEFORE UPDATE OR DELETE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.protect_cargo_developer();

-- ============ PERMISSÕES POR CARGO ============
CREATE TABLE IF NOT EXISTS public.cargo_permissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  modulo text NOT NULL,
  acao text NOT NULL CHECK (acao IN ('visualizar','criar','editar','excluir')),
  permitido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cargo_id, modulo, acao)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargo_permissoes TO authenticated;
GRANT ALL ON public.cargo_permissoes TO service_role;

ALTER TABLE public.cargo_permissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos leem cargo_permissoes"
  ON public.cargo_permissoes FOR SELECT TO authenticated
  USING (is_internal_user(auth.uid()));

CREATE POLICY "Admins gerenciam cargo_permissoes"
  ON public.cargo_permissoes FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR has_role(auth.uid(), 'desenvolvedor'::app_role)
    OR has_role(auth.uid(), 'ceo'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR has_role(auth.uid(), 'desenvolvedor'::app_role)
    OR has_role(auth.uid(), 'ceo'::app_role)
  );

CREATE INDEX IF NOT EXISTS idx_cargo_permissoes_cargo ON public.cargo_permissoes(cargo_id);

-- ============ PROFILES: extras ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cargo_id uuid REFERENCES public.cargos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_entrada date,
  ADD COLUMN IF NOT EXISTS ultimo_login timestamptz;

-- ============ SEED CARGOS PADRÃO ============
INSERT INTO public.cargos (chave, nome, descricao, cor, protegido, ativo) VALUES
  ('developer',   'Developer',   'Acesso total. Protegido — só outro Developer pode remover.', '#a78bfa', true,  true),
  ('ceo',         'CEO',         'Acesso completo aos módulos operacionais.',                   '#f0c674', false, true),
  ('comercial',   'Comercial',   'Time comercial — leads, CRM e reservas.',                     '#7dd3fc', false, true),
  ('financeiro',  'Financeiro',  'Time financeiro — pagamentos, despesas e relatórios.',        '#86efac', false, true),
  ('operacional', 'Operacional', 'Time operacional — expedições e participantes.',              '#fcd34d', false, true),
  ('marketing',   'Marketing',   'Time de marketing — mídia, documentos e conteúdo.',           '#fda4af', false, true)
ON CONFLICT (chave) DO NOTHING;

-- Permissões padrão para Developer (tudo)
INSERT INTO public.cargo_permissoes (cargo_id, modulo, acao, permitido)
SELECT c.id, m.modulo, a.acao, true
FROM public.cargos c
CROSS JOIN (VALUES
  ('dashboard'),('leads'),('crm'),('reservas'),('financeiro'),
  ('expedicoes'),('documentos'),('configuracoes'),('usuarios'),
  ('cargos'),('integracoes'),('historico')
) AS m(modulo)
CROSS JOIN (VALUES ('visualizar'),('criar'),('editar'),('excluir')) AS a(acao)
WHERE c.chave = 'developer'
ON CONFLICT DO NOTHING;

-- Permissões padrão para CEO (operacional completo, sem usuários/cargos/integrações)
INSERT INTO public.cargo_permissoes (cargo_id, modulo, acao, permitido)
SELECT c.id, m.modulo, a.acao, true
FROM public.cargos c
CROSS JOIN (VALUES
  ('dashboard'),('leads'),('crm'),('reservas'),
  ('financeiro'),('expedicoes'),('documentos')
) AS m(modulo)
CROSS JOIN (VALUES ('visualizar'),('criar'),('editar'),('excluir')) AS a(acao)
WHERE c.chave = 'ceo'
ON CONFLICT DO NOTHING;

-- Stubs (apenas visualizar) para os demais cargos preparados
INSERT INTO public.cargo_permissoes (cargo_id, modulo, acao, permitido)
SELECT c.id, 'dashboard', 'visualizar', true
FROM public.cargos c
WHERE c.chave IN ('comercial','financeiro','operacional','marketing')
ON CONFLICT DO NOTHING;
