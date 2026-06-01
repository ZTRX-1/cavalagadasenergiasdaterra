ALTER TABLE public.expedicoes
  ADD COLUMN IF NOT EXISTS como_chegar_titulo text,
  ADD COLUMN IF NOT EXISTS como_chegar_conteudo text,
  ADD COLUMN IF NOT EXISTS como_chegar_aeroporto text,
  ADD COLUMN IF NOT EXISTS como_chegar_referencia text,
  ADD COLUMN IF NOT EXISTS como_chegar_observacoes text;