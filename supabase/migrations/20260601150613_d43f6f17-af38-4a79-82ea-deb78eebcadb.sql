-- Função preparatória para eventos futuros de parcelas (chamada por pg_cron mais tarde)
CREATE OR REPLACE FUNCTION public.scan_parcelas_vencimento()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  -- parcela_atrasada: previstas com data_prevista < hoje
  FOR r IN
    SELECT p.id, p.reserva_id, p.tipo, p.valor, p.data_prevista
    FROM public.pagamentos p
    WHERE p.status = 'previsto'
      AND p.data_prevista IS NOT NULL
      AND p.data_prevista < CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM public.webhooks_eventos w
        WHERE w.evento = 'parcela_atrasada'
          AND w.entidade = 'pagamento'
          AND w.entidade_id = p.id
          AND w.created_at::date = CURRENT_DATE
      )
  LOOP
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('parcela_atrasada', 'pagamento', r.id,
      jsonb_build_object('reserva_id', r.reserva_id, 'tipo', r.tipo, 'valor', r.valor, 'data_prevista', r.data_prevista));
  END LOOP;

  -- parcela_vencendo: previstas com data_prevista entre hoje e +5 dias
  FOR r IN
    SELECT p.id, p.reserva_id, p.tipo, p.valor, p.data_prevista
    FROM public.pagamentos p
    WHERE p.status = 'previsto'
      AND p.data_prevista IS NOT NULL
      AND p.data_prevista BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '5 days')
      AND NOT EXISTS (
        SELECT 1 FROM public.webhooks_eventos w
        WHERE w.evento = 'parcela_vencendo'
          AND w.entidade = 'pagamento'
          AND w.entidade_id = p.id
          AND w.created_at::date = CURRENT_DATE
      )
  LOOP
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('parcela_vencendo', 'pagamento', r.id,
      jsonb_build_object('reserva_id', r.reserva_id, 'tipo', r.tipo, 'valor', r.valor, 'data_prevista', r.data_prevista));
  END LOOP;
END;
$$;