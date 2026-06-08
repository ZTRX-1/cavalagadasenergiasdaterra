-- 1. Fix Function Search Paths (SECURITY 0011)
ALTER FUNCTION public.reconstruir_resumo_ia_reserva(uuid) SET search_path = public;
ALTER FUNCTION public.atualizar_vagas_disponiveis() SET search_path = public;
ALTER FUNCTION public.log_conversao_lead() SET search_path = public;
ALTER FUNCTION public.gerar_resumo_ia_lead() SET search_path = public;
ALTER FUNCTION public.fn_master_sync_participantes() SET search_path = public;
ALTER FUNCTION public.trg_validar_participante_idade() SET search_path = public;
ALTER FUNCTION public.check_crm_health() SET search_path = public;
ALTER FUNCTION public.trg_log_reserva_changes() SET search_path = public;
ALTER FUNCTION public.sync_reserva_to_lead_summary() SET search_path = public;
ALTER FUNCTION public.sanitizar_origem_lead() SET search_path = public;
ALTER FUNCTION public.fn_sync_participante_to_reserva_json() SET search_path = public;

-- 2. Revoke Public Execute on SECURITY DEFINER Functions (SECURITY 0028/0029)
REVOKE EXECUTE ON FUNCTION public.reconstruir_resumo_ia_reserva(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.documento_central_evento() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.scan_parcelas_vencimento() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lead_etapa_changed() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_primary_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_internal_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.slugify_unique_expedicao(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserva_status_changed() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lead_conversa_inserida() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_desenvolvedor_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_cargo_developer() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lead_force_etapa_novo() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_validar_participante_idade() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_log_reserva_changes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pagamento_registrado() FROM PUBLIC;

-- Grant access back to service_role (standard)
GRANT EXECUTE ON FUNCTION public.reconstruir_resumo_ia_reserva(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.documento_central_evento() TO service_role;
GRANT EXECUTE ON FUNCTION public.scan_parcelas_vencimento() TO service_role;
GRANT EXECUTE ON FUNCTION public.lead_etapa_changed() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_internal_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.slugify_unique_expedicao(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserva_status_changed() TO service_role;
GRANT EXECUTE ON FUNCTION public.lead_conversa_inserida() TO service_role;
GRANT EXECUTE ON FUNCTION public.protect_desenvolvedor_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.protect_cargo_developer() TO service_role;
GRANT EXECUTE ON FUNCTION public.lead_force_etapa_novo() TO service_role;
GRANT EXECUTE ON FUNCTION public.trg_validar_participante_idade() TO service_role;
GRANT EXECUTE ON FUNCTION public.trg_log_reserva_changes() TO service_role;
GRANT EXECUTE ON FUNCTION public.pagamento_registrado() TO service_role;

-- Some might be needed by authenticated users (e.g., getting their own role)
GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_internal_user(uuid) TO authenticated;

-- 3. Tighten RLS Policy on page_views (SECURITY 0024)
DROP POLICY IF EXISTS "Qualquer um insere page_views" ON public.page_views;
CREATE POLICY "Apenas usuários autenticados inserem page_views" 
ON public.page_views FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. Prevent Storage Listing on Public Buckets (SECURITY 0025)
DROP POLICY IF EXISTS "Midia expedicao publica" ON storage.objects;
CREATE POLICY "Midia expedicao publica" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'expedicao-midia' AND (storage.foldername(name))[1] <> '');

DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
CREATE POLICY "Avatars publicly readable" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] <> '');
