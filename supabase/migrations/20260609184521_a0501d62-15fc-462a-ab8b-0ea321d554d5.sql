ALTER TABLE public.expedicoes ADD COLUMN como_chegar_distancias TEXT;
COMMENT ON COLUMN public.expedicoes.como_chegar_distancias IS 'Distâncias das principais capitais em relação ao ponto de encontro da expedição.';
