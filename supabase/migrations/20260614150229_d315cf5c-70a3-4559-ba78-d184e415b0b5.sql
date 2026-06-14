
-- Recreate view as security invoker (respects caller RLS)
DROP VIEW IF EXISTS public.vw_jornada_consistencia;
CREATE VIEW public.vw_jornada_consistencia
WITH (security_invoker = on) AS
SELECT 'reserva_sem_lead'::text AS tipo, r.id AS entidade_id, r.protocolo AS referencia
  FROM public.reservas r WHERE r.lead_id IS NULL
UNION ALL
SELECT 'participante_sem_reserva', p.id, p.nome
  FROM public.participantes p WHERE p.reserva_id IS NULL
UNION ALL
SELECT 'pagamento_sem_reserva', pg.id, pg.tipo
  FROM public.pagamentos pg WHERE pg.reserva_id IS NULL
UNION ALL
SELECT 'valor_pago_divergente', r.id, r.protocolo
  FROM public.reservas r
  WHERE r.valor_pago IS DISTINCT FROM (
    SELECT COALESCE(SUM(valor),0) FROM public.pagamentos
    WHERE reserva_id = r.id AND status='confirmado' AND tipo<>'reembolso' AND moeda = r.moeda
  )
UNION ALL
SELECT 'reserva_com_pagamento_moeda_divergente', r.id, r.protocolo
  FROM public.reservas r WHERE r.tem_pagamento_moeda_divergente = true;

GRANT SELECT ON public.vw_jornada_consistencia TO authenticated;
GRANT ALL    ON public.vw_jornada_consistencia TO service_role;

-- Trigger-only / internal SECURITY DEFINER functions: revoke public/authenticated EXECUTE
REVOKE EXECUTE ON FUNCTION public.recalcular_vagas_data(uuid)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_recalcular_vagas()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_master_sync_participantes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pagamento_registrado()        FROM PUBLIC, anon, authenticated;
