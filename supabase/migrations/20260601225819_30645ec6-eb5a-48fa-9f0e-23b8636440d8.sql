DROP TRIGGER IF EXISTS trg_reserva_status_changed ON public.reservas;

CREATE TRIGGER trg_reserva_status_changed_before
BEFORE UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.reserva_status_changed();

CREATE TRIGGER trg_reserva_status_changed_after
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.reserva_status_changed();