ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tipo_grupo TEXT;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS tipo_grupo TEXT;

COMMENT ON COLUMN public.leads.tipo_grupo IS 'Tipo de experiência/grupo: individual, casal, grupo ou personalizada';
COMMENT ON COLUMN public.reservas.tipo_grupo IS 'Tipo de experiência/grupo: individual, casal, grupo ou personalizada';
