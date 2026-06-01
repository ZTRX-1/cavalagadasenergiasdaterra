-- Triggers para alimentar webhooks_eventos / lead_conversas / reserva_historico

DROP TRIGGER IF EXISTS trg_lead_etapa_changed ON public.leads;
CREATE TRIGGER trg_lead_etapa_changed
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.lead_etapa_changed();

DROP TRIGGER IF EXISTS trg_reserva_status_changed ON public.reservas;
CREATE TRIGGER trg_reserva_status_changed
BEFORE INSERT OR UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.reserva_status_changed();

DROP TRIGGER IF EXISTS trg_lead_conversa_inserida ON public.lead_conversas;
CREATE TRIGGER trg_lead_conversa_inserida
AFTER INSERT ON public.lead_conversas
FOR EACH ROW
EXECUTE FUNCTION public.lead_conversa_inserida();

DROP TRIGGER IF EXISTS trg_pagamento_registrado ON public.pagamentos;
CREATE TRIGGER trg_pagamento_registrado
AFTER INSERT OR UPDATE ON public.pagamentos
FOR EACH ROW
EXECUTE FUNCTION public.pagamento_registrado();

DROP TRIGGER IF EXISTS trg_documento_central_evento ON public.documentos_central;
CREATE TRIGGER trg_documento_central_evento
BEFORE INSERT OR UPDATE ON public.documentos_central
FOR EACH ROW
EXECUTE FUNCTION public.documento_central_evento();

DROP TRIGGER IF EXISTS trg_update_leads_updated_at ON public.leads;
CREATE TRIGGER trg_update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_reservas_updated_at ON public.reservas;
CREATE TRIGGER trg_update_reservas_updated_at
BEFORE UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();