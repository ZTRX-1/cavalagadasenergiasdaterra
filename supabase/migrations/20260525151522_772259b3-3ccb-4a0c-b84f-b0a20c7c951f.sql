
REVOKE EXECUTE ON FUNCTION public.gerar_protocolo_lead() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gerar_protocolo_lead() TO authenticated;

CREATE POLICY "Sem acesso direto protocolo_lead_counter" ON public.protocolo_lead_counter
  FOR SELECT TO authenticated USING (false);
