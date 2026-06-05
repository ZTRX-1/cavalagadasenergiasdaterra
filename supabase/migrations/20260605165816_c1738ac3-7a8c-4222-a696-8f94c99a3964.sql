ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_etapa_chk;
ALTER TABLE public.leads ADD CONSTRAINT leads_etapa_chk CHECK (etapa_atendimento = ANY (ARRAY[
  'novo','em_atendimento','qualificado','interessado','pronto_reserva',
  'encaminhado_financeiro','pago','convertido','perdido'
]));