-- Add proper foreign keys so PostgREST embed (expedicoes -> expedicao_assets / datas) works
ALTER TABLE public.expedicao_assets
  DROP CONSTRAINT IF EXISTS expedicao_assets_expedicao_id_fkey;
ALTER TABLE public.expedicao_assets
  ADD CONSTRAINT expedicao_assets_expedicao_id_fkey
  FOREIGN KEY (expedicao_id) REFERENCES public.expedicoes(id) ON DELETE CASCADE;

ALTER TABLE public.datas
  DROP CONSTRAINT IF EXISTS datas_expedicao_id_fkey;
ALTER TABLE public.datas
  ADD CONSTRAINT datas_expedicao_id_fkey
  FOREIGN KEY (expedicao_id) REFERENCES public.expedicoes(id) ON DELETE CASCADE;

ALTER TABLE public.midia
  DROP CONSTRAINT IF EXISTS midia_expedicao_id_fkey;
ALTER TABLE public.midia
  ADD CONSTRAINT midia_expedicao_id_fkey
  FOREIGN KEY (expedicao_id) REFERENCES public.expedicoes(id) ON DELETE CASCADE;

ALTER TABLE public.lead_atividades
  DROP CONSTRAINT IF EXISTS lead_atividades_lead_id_fkey;
ALTER TABLE public.lead_atividades
  ADD CONSTRAINT lead_atividades_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;

-- Unique slug guarantee on expedicoes (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expedicoes_slug_key' AND conrelid = 'public.expedicoes'::regclass
  ) THEN
    BEGIN
      ALTER TABLE public.expedicoes ADD CONSTRAINT expedicoes_slug_key UNIQUE (slug);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END$$;
