ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS etapa_abandono TEXT;
-- Garante que o status 'incompleto' possa ser usado. 
-- Se for uma coluna TEXT, não precisa fazer nada especial. 
-- Se fosse enum, precisaríamos adicionar o valor. Como é TEXT, estamos ok.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
