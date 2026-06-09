-- 1. Atualizar ENUMs e Tipos de Status de Leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS etapa_operacional TEXT DEFAULT 'novo',
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES auth.users(id);

-- 2. Garantir vínculo permanente entre Lead e Reserva
ALTER TABLE public.reservas
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id),
ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS status_documentacao TEXT DEFAULT 'pendente';

-- 3. Melhorar estrutura de Participantes para grupos e ocupação
ALTER TABLE public.participantes
ADD COLUMN IF NOT EXISTS responsavel_reserva BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS documento_validado BOOLEAN DEFAULT false;

-- 4. Funções para Controle Automático de Vagas
CREATE OR REPLACE FUNCTION public.atualizar_vagas_expedicao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se reserva confirmada ou pendente (que bloqueia vaga), atualiza datas
  UPDATE public.datas
  SET vagas_disponiveis = vagas_total - (
    SELECT COALESCE(SUM(quantidade_participantes), 0)
    FROM public.reservas
    WHERE data_id = NEW.data_id 
    AND status_operacional IN ('reserva_confirmada', 'participante_confirmado', 'pre_reserva')
  )
  WHERE id = NEW.data_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_atualizar_vagas_reserva ON public.reservas;
CREATE TRIGGER tr_atualizar_vagas_reserva
AFTER INSERT OR UPDATE OF status_operacional, quantidade_participantes ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.atualizar_vagas_expedicao();

-- 5. Grant permissions (conforme o contrato de orquestração)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
