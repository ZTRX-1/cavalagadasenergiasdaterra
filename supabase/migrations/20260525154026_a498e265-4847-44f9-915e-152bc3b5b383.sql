
-- LEADS
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS peso numeric,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS experiencia_equestre text,
  ADD COLUMN IF NOT EXISTS observacoes_medicas text,
  ADD COLUMN IF NOT EXISTS restricoes_alimentares text;

-- PARTICIPANTES
ALTER TABLE public.participantes
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS peso numeric,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS restricoes_alimentares text;

-- RESERVAS (grupo)
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS grupo_nome text,
  ADD COLUMN IF NOT EXISTS saldo_restante numeric GENERATED ALWAYS AS (COALESCE(valor_total,0) - COALESCE(valor_pago,0)) STORED;

-- DOCUMENTOS
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS reserva_id uuid,
  ADD COLUMN IF NOT EXISTS categoria text;

CREATE INDEX IF NOT EXISTS idx_documentos_reserva ON public.documentos(reserva_id);
CREATE INDEX IF NOT EXISTS idx_documentos_expedicao ON public.documentos(expedicao_id);
CREATE INDEX IF NOT EXISTS idx_documentos_participante ON public.documentos(participante_id);
CREATE INDEX IF NOT EXISTS idx_participantes_reserva ON public.participantes(reserva_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status ON public.reservas(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
