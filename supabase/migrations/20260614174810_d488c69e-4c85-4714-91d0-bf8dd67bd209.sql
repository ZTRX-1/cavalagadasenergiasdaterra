
ALTER TABLE public.ia_decisoes
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'heuristica',
  ADD COLUMN IF NOT EXISTS tokens_input integer,
  ADD COLUMN IF NOT EXISTS tokens_output integer,
  ADD COLUMN IF NOT EXISTS custo_estimado numeric(12,6),
  ADD COLUMN IF NOT EXISTS modelo_utilizado text,
  ADD COLUMN IF NOT EXISTS tempo_llm_ms integer;

CREATE INDEX IF NOT EXISTS ia_decisoes_origem_idx ON public.ia_decisoes(origem);
