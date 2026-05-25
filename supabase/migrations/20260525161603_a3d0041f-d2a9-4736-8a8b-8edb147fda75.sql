
-- 1) Documentos: campo escopo
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS escopo text NOT NULL DEFAULT 'institucional';

-- 2) Profiles: campo ativo
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- 3) Configuracoes: endereco + email
ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS email text;

-- 4) Enum app_role: novos papéis (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'financeiro' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'financeiro';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'operacional' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'operacional';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'midia' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'midia';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'atendimento' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'atendimento';
  END IF;
END$$;

-- 5) Triggers de updated_at — reutiliza public.update_updated_at_column() existente
DROP TRIGGER IF EXISTS trg_expedicoes_updated_at ON public.expedicoes;
CREATE TRIGGER trg_expedicoes_updated_at
  BEFORE UPDATE ON public.expedicoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_datas_updated_at ON public.datas;
CREATE TRIGGER trg_datas_updated_at
  BEFORE UPDATE ON public.datas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_reservas_updated_at ON public.reservas;
CREATE TRIGGER trg_reservas_updated_at
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_participantes_updated_at ON public.participantes;
CREATE TRIGGER trg_participantes_updated_at
  BEFORE UPDATE ON public.participantes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_configuracoes_updated_at ON public.configuracoes;
CREATE TRIGGER trg_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
