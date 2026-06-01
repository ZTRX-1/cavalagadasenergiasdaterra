
-- 1. Novos papéis
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'desenvolvedor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ceo_preview';
