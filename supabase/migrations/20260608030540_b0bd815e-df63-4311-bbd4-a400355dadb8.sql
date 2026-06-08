-- Final sweep to update remaining policies to use auth_internal

-- Page Views
DROP POLICY IF EXISTS "Internos leem page_views" ON public.page_views;
CREATE POLICY "Internos leem page_views" ON public.page_views FOR SELECT TO authenticated USING (auth_internal.is_internal_user(auth.uid()));

-- Integracoes Status
DROP POLICY IF EXISTS "Admins gerenciam integracoes_status" ON public.integracoes_status;
CREATE POLICY "Admins gerenciam integracoes_status" ON public.integracoes_status FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- IA Config
DROP POLICY IF EXISTS "Admins gerenciam ia_configuracoes" ON public.ia_configuracoes;
CREATE POLICY "Admins gerenciam ia_configuracoes" ON public.ia_configuracoes FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- Financial tables
DROP POLICY IF EXISTS "Internos gerenciam contas_pagar" ON public.contas_pagar;
CREATE POLICY "Internos gerenciam contas_pagar" ON public.contas_pagar FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam contas_receber" ON public.contas_receber;
CREATE POLICY "Internos gerenciam contas_receber" ON public.contas_receber FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam despesas" ON public.despesas;
CREATE POLICY "Internos gerenciam despesas" ON public.despesas FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));

-- CRM auxiliary tables
DROP POLICY IF EXISTS "Internos gerenciam lead_atividades" ON public.lead_atividades;
CREATE POLICY "Internos gerenciam lead_atividades" ON public.lead_atividades FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam lead_conversas" ON public.lead_conversas;
CREATE POLICY "Internos gerenciam lead_conversas" ON public.lead_conversas FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam lead_memoria" ON public.lead_memoria;
CREATE POLICY "Internos gerenciam lead_memoria" ON public.lead_memoria FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));

-- Operational tables
DROP POLICY IF EXISTS "Internos gerenciam webhooks_eventos" ON public.webhooks_eventos;
CREATE POLICY "Internos gerenciam webhooks_eventos" ON public.webhooks_eventos FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam pagamentos" ON public.pagamentos;
CREATE POLICY "Internos gerenciam pagamentos" ON public.pagamentos FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam reserva_documentos" ON public.reserva_documentos;
CREATE POLICY "Internos gerenciam reserva_documentos" ON public.reserva_documentos FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam reserva_historico" ON public.reserva_historico;
CREATE POLICY "Internos gerenciam reserva_historico" ON public.reserva_historico FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos gerenciam documentos_central" ON public.documentos_central;
CREATE POLICY "Internos gerenciam documentos_central" ON public.documentos_central FOR ALL TO authenticated USING (auth_internal.is_internal_user(auth.uid()));

-- Central docs storage
DROP POLICY IF EXISTS "Internos leem central-docs" ON storage.objects;
CREATE POLICY "Internos leem central-docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'central-docs' AND auth_internal.is_internal_user(auth.uid()));
DROP POLICY IF EXISTS "Internos atualizam central-docs" ON storage.objects;
CREATE POLICY "Internos atualizam central-docs" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'central-docs' AND auth_internal.is_internal_user(auth.uid()));
