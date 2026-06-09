-- Adiciona flag de exclusão lógica para notificações
ALTER TABLE public.notificacoes_lidas ADD COLUMN IF NOT EXISTS excluida BOOLEAN DEFAULT false;

-- Garante colunas de suporte ao novo funil em leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS idade INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tipo_grupo TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS etapa_abandono TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS etapa_operacional TEXT;

-- Garante colunas em participantes
ALTER TABLE public.participantes ADD COLUMN IF NOT EXISTS idade INTEGER;

-- Garante colunas em reservas
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS tipo_grupo TEXT;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS status_financeiro TEXT;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS status_operacional TEXT;

-- Grant permissions (always required after structure changes for safety)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes_lidas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participantes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
