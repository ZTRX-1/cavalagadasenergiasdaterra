-- Fix search path for public wrapper functions (SECURITY 0011)
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.is_internal_user(uuid) SET search_path = public;
ALTER FUNCTION public.gerar_protocolo() SET search_path = public;
ALTER FUNCTION public.gerar_protocolo_lead() SET search_path = public;
