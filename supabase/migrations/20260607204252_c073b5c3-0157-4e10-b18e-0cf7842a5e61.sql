-- 1. Adiciona campos de rastreabilidade no participante
ALTER TABLE public.participantes
  ADD COLUMN IF NOT EXISTS status_motivo TEXT,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT now();

-- 2. Função que sincroniza status dos participantes quando a reserva muda
CREATE OR REPLACE FUNCTION public.sync_participantes_status_from_reserva()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    novo_status TEXT;
    motivo TEXT;
BEGIN
    -- Detecta cancelamento/reembolso/expiração
    IF NEW.status_operacional IN ('cancelada', 'cancelado', 'reembolsada', 'reembolsado', 'expirada', 'expirado')
       OR NEW.status_pagamento IN ('cancelado', 'reembolsado', 'expirado')
       OR NEW.status_financeiro IN ('cancelado', 'reembolsado') THEN
        novo_status := 'cancelado';
        motivo := CASE
            WHEN NEW.status_operacional ILIKE '%reembols%' OR NEW.status_pagamento = 'reembolsado' THEN 'Reembolso da reserva'
            WHEN NEW.status_operacional ILIKE '%expir%' OR NEW.status_pagamento = 'expirado' THEN 'Expiração da reserva'
            ELSE 'Cancelamento da reserva'
        END;

        UPDATE public.participantes
        SET status = novo_status,
            status_motivo = motivo,
            status_changed_at = now(),
            updated_at = now()
        WHERE reserva_id = NEW.id
          AND status <> novo_status;

    -- Detecta reativação para estado confirmado
    ELSIF NEW.status_operacional IN ('reserva_confirmada', 'participante_confirmado')
          OR NEW.status_financeiro = 'pago_integralmente'
          OR NEW.status_pagamento = 'confirmado' THEN
        UPDATE public.participantes
        SET status = 'confirmado',
            status_motivo = 'Sincronizado com confirmação da reserva',
            status_changed_at = now(),
            updated_at = now()
        WHERE reserva_id = NEW.id
          AND status = 'cancelado';
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Trigger no UPDATE de reservas
DROP TRIGGER IF EXISTS tr_sync_participantes_on_cancellation ON public.reservas;
CREATE TRIGGER tr_sync_participantes_on_cancellation
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (
  OLD.status_operacional IS DISTINCT FROM NEW.status_operacional
  OR OLD.status_pagamento IS DISTINCT FROM NEW.status_pagamento
  OR OLD.status_financeiro IS DISTINCT FROM NEW.status_financeiro
)
EXECUTE FUNCTION public.sync_participantes_status_from_reserva();
