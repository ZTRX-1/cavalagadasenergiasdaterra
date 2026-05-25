
-- ============ EXPEDICOES ============
ALTER TABLE public.expedicoes
  ADD COLUMN IF NOT EXISTS subtitulo text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS vagas_total_padrao int NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS parcelamento_max int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS politicas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'publicado',
  ADD COLUMN IF NOT EXISTS capa_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS expedicoes_updated_at ON public.expedicoes;
CREATE TRIGGER expedicoes_updated_at BEFORE UPDATE ON public.expedicoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Expedicoes ativas publicas" ON public.expedicoes;
CREATE POLICY "Expedicoes publicadas publicas" ON public.expedicoes
  FOR SELECT TO public USING (ativo = true AND status = 'publicado');
CREATE POLICY "Internos gerenciam expedicoes" ON public.expedicoes
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid()))
  WITH CHECK (public.is_internal_user(auth.uid()));

-- ============ DATAS ============
ALTER TABLE public.datas
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS datas_updated_at ON public.datas;
CREATE TRIGGER datas_updated_at BEFORE UPDATE ON public.datas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Internos gerenciam datas" ON public.datas
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid()))
  WITH CHECK (public.is_internal_user(auth.uid()));

-- ============ LEADS ============
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS acompanhantes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_pessoas int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS valor_estimado numeric,
  ADD COLUMN IF NOT EXISTS protocolo text UNIQUE;

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- protocolo_lead_counter + função
CREATE TABLE IF NOT EXISTS public.protocolo_lead_counter (
  ano int PRIMARY KEY,
  valor int NOT NULL DEFAULT 0
);
ALTER TABLE public.protocolo_lead_counter ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.gerar_protocolo_lead()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ano_atual int := EXTRACT(YEAR FROM now())::int;
  novo_valor int;
BEGIN
  INSERT INTO public.protocolo_lead_counter (ano, valor)
  VALUES (ano_atual, 1)
  ON CONFLICT (ano) DO UPDATE SET valor = protocolo_lead_counter.valor + 1
  RETURNING valor INTO novo_valor;
  RETURN 'LEAD-' || ano_atual::text || '-' || LPAD(novo_valor::text, 4, '0');
END;
$$;

-- ============ PARTICIPANTES ============
ALTER TABLE public.participantes
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS experiencia_equestre text,
  ADD COLUMN IF NOT EXISTS restricoes text,
  ADD COLUMN IF NOT EXISTS acompanhante text,
  ADD COLUMN IF NOT EXISTS expedicao_id uuid,
  ADD COLUMN IF NOT EXISTS data_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente';

DROP TRIGGER IF EXISTS participantes_updated_at ON public.participantes;
CREATE TRIGGER participantes_updated_at BEFORE UPDATE ON public.participantes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RESERVAS ============
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS valor_total numeric,
  ADD COLUMN IF NOT EXISTS valor_pago numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forma_pagamento text,
  ADD COLUMN IF NOT EXISTS parcelas int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status_pagamento text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS reservas_updated_at ON public.reservas;
CREATE TRIGGER reservas_updated_at BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Internos gerenciam reservas" ON public.reservas
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid()))
  WITH CHECK (public.is_internal_user(auth.uid()));

-- ============ PROFILES — campo role ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'operador';

-- ============ LEAD_ATIVIDADES ============
CREATE TABLE IF NOT EXISTS public.lead_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  tipo text NOT NULL,
  descricao text,
  autor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_atividades_lead_id_idx ON public.lead_atividades(lead_id);
ALTER TABLE public.lead_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internos gerenciam lead_atividades" ON public.lead_atividades
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid()))
  WITH CHECK (public.is_internal_user(auth.uid()));

-- ============ ACTIVITY_LOGS ============
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario uuid,
  acao text NOT NULL,
  modulo text NOT NULL,
  descricao text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_logs_modulo_idx ON public.activity_logs(modulo, created_at DESC);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internos leem activity_logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()));
CREATE POLICY "Internos inserem activity_logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));

-- ============ EXPEDICAO_ASSETS ============
CREATE TABLE IF NOT EXISTS public.expedicao_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedicao_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'imagem',
  url text NOT NULL,
  titulo text,
  ordem int NOT NULL DEFAULT 0,
  is_capa boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS expedicao_assets_exp_idx ON public.expedicao_assets(expedicao_id, ordem);
ALTER TABLE public.expedicao_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assets publicos quando expedicao publicada" ON public.expedicao_assets
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.expedicoes e
    WHERE e.id = expedicao_assets.expedicao_id
      AND e.ativo = true
      AND e.status = 'publicado'
  ));
CREATE POLICY "Internos gerenciam assets" ON public.expedicao_assets
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid()))
  WITH CHECK (public.is_internal_user(auth.uid()));

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('expedicao-midia', 'expedicao-midia', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('expedicao-docs', 'expedicao-docs', false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('participante-docs', 'participante-docs', false)
ON CONFLICT (id) DO NOTHING;

-- expedicao-midia (público leitura, escrita interna)
CREATE POLICY "Midia expedicao publica" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'expedicao-midia');
CREATE POLICY "Midia expedicao internos insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expedicao-midia' AND public.is_internal_user(auth.uid()));
CREATE POLICY "Midia expedicao internos update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'expedicao-midia' AND public.is_internal_user(auth.uid()));
CREATE POLICY "Midia expedicao internos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'expedicao-midia' AND public.is_internal_user(auth.uid()));

-- expedicao-docs (privado)
CREATE POLICY "Docs expedicao internos select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'expedicao-docs' AND public.is_internal_user(auth.uid()));
CREATE POLICY "Docs expedicao internos insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expedicao-docs' AND public.is_internal_user(auth.uid()));
CREATE POLICY "Docs expedicao internos update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'expedicao-docs' AND public.is_internal_user(auth.uid()));
CREATE POLICY "Docs expedicao internos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'expedicao-docs' AND public.is_internal_user(auth.uid()));

-- participante-docs (privado)
CREATE POLICY "Docs part internos select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'participante-docs' AND public.is_internal_user(auth.uid()));
CREATE POLICY "Docs part internos insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'participante-docs' AND public.is_internal_user(auth.uid()));
CREATE POLICY "Docs part internos update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'participante-docs' AND public.is_internal_user(auth.uid()));
CREATE POLICY "Docs part internos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'participante-docs' AND public.is_internal_user(auth.uid()));
