
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  empresa_nome text,
  empresa_cnpj text,
  whatsapp text,
  emails_notificacao text[] NOT NULL DEFAULT ARRAY[]::text[],
  instagram text,
  logo_url text,
  cor_destaque text,
  preferencias jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internos leem configuracoes" ON public.configuracoes;
CREATE POLICY "Internos leem configuracoes" ON public.configuracoes
  FOR SELECT TO authenticated
  USING (public.is_internal_user(auth.uid()));

DROP POLICY IF EXISTS "Internos gerenciam configuracoes" ON public.configuracoes;
CREATE POLICY "Internos gerenciam configuracoes" ON public.configuracoes
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid()))
  WITH CHECK (public.is_internal_user(auth.uid()));

DROP TRIGGER IF EXISTS update_configuracoes_updated_at ON public.configuracoes;
CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.configuracoes (singleton) VALUES (true) ON CONFLICT DO NOTHING;
