DROP TRIGGER IF EXISTS leads_etapa_trigger ON public.leads;
DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS trg_update_leads_updated_at ON public.leads;

DROP TRIGGER IF EXISTS reservas_updated_at ON public.reservas;
DROP TRIGGER IF EXISTS trg_update_reservas_updated_at ON public.reservas;
DROP TRIGGER IF EXISTS trg_reserva_status_changed_after ON public.reservas;

DROP TRIGGER IF EXISTS trg_reserva_status_changed ON public.reservas;
CREATE TRIGGER trg_reserva_status_changed
  BEFORE INSERT OR UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.reserva_status_changed();