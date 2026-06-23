
-- FASE A: Reestruturação CRM - Backend (v2 com fix do check)
-- ============================================================

-- 0) Atualizar check constraint para aceitar novos valores de etapa
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_etapa_chk;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_etapa_chk CHECK (etapa_atendimento IN (
    'novo','em_atendimento','proposta_enviada','reserva_confirmada',
    'expedicao_realizada','perdido','reativacao',
    -- aliases legados aceitos durante transição
    'triagem_ia','qualificado','reserva_pendente','participante_confirmado','convertido','concluido'
  ));

-- 1) MAPEAMENTO DE ETAPAS ANTIGAS PARA NOVAS
UPDATE public.leads SET etapa_atendimento = CASE
  WHEN etapa_atendimento = 'novo' THEN 'novo'
  WHEN etapa_atendimento IN ('qualificado','triagem_ia','em_atendimento','contato_inicial') THEN 'em_atendimento'
  WHEN etapa_atendimento IN ('proposta_enviada','proposta') THEN 'proposta_enviada'
  WHEN etapa_atendimento IN ('reserva_pendente','reserva_confirmada','participante_confirmado','convertido') THEN 'reserva_confirmada'
  WHEN etapa_atendimento IN ('concluido','expedicao_realizada','pos_venda') THEN 'expedicao_realizada'
  WHEN etapa_atendimento = 'perdido' THEN 'perdido'
  WHEN etapa_atendimento = 'reativacao' THEN 'reativacao'
  ELSE 'em_atendimento'
END;

-- Atualizar lead_force_etapa_novo para permitir promoções via UPDATE
-- (já só atua em INSERT segundo o código atual, então OK)

-- 2) MOTIVO DE PERDA
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS motivo_perda text;

-- 3) MEMÓRIA IA: separar Fatos x Inferências
ALTER TABLE public.lead_memoria
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'fato' CHECK (tipo IN ('fato','inferencia'));

CREATE TABLE IF NOT EXISTS public.lead_memoria_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('fato','inferencia')),
  categoria text,
  chave text,
  valor text NOT NULL,
  origem text NOT NULL DEFAULT 'humano' CHECK (origem IN ('humano','ia','sistema')),
  confianca numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_memoria_itens TO authenticated;
GRANT ALL ON public.lead_memoria_itens TO service_role;

ALTER TABLE public.lead_memoria_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internos gerenciam memória IA" ON public.lead_memoria_itens;
CREATE POLICY "Internos gerenciam memória IA"
ON public.lead_memoria_itens FOR ALL
TO authenticated
USING (public.is_internal_user(auth.uid()))
WITH CHECK (public.is_internal_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_lead_memoria_itens_lead ON public.lead_memoria_itens(lead_id, tipo);

DROP TRIGGER IF EXISTS trg_lead_memoria_itens_updated_at ON public.lead_memoria_itens;
CREATE TRIGGER trg_lead_memoria_itens_updated_at
  BEFORE UPDATE ON public.lead_memoria_itens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) MULTIMOEDA em pagamentos
ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS valor_original numeric,
  ADD COLUMN IF NOT EXISTS moeda_original text,
  ADD COLUMN IF NOT EXISTS cotacao numeric,
  ADD COLUMN IF NOT EXISTS valor_convertido_brl numeric;

UPDATE public.pagamentos
SET valor_original = COALESCE(valor_original, valor),
    moeda_original = COALESCE(moeda_original, moeda, 'BRL'),
    cotacao = COALESCE(cotacao, 1),
    valor_convertido_brl = COALESCE(valor_convertido_brl, valor)
WHERE valor IS NOT NULL;

-- 5) MULTIMOEDA em reservas
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS cotacao_referencia numeric,
  ADD COLUMN IF NOT EXISTS valor_total_brl numeric;

UPDATE public.reservas
SET cotacao_referencia = COALESCE(cotacao_referencia, 1),
    valor_total_brl = COALESCE(valor_total_brl, valor_total)
WHERE valor_total IS NOT NULL;

-- 6) PÓS-VENDA AUTOMÁTICA
CREATE OR REPLACE VIEW public.vw_leads_pos_expedicao AS
SELECT DISTINCT r.lead_id
FROM public.reservas r
JOIN public.datas d ON d.id = r.data_id
WHERE r.lead_id IS NOT NULL
  AND r.status_operacional IN ('reserva_confirmada','participante_confirmado')
  AND d.data_fim IS NOT NULL
  AND d.data_fim < CURRENT_DATE;

GRANT SELECT ON public.vw_leads_pos_expedicao TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.processar_pos_expedicao()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.leads l
  SET etapa_atendimento = 'expedicao_realizada',
      updated_at = now()
  FROM public.vw_leads_pos_expedicao v
  WHERE l.id = v.lead_id
    AND l.etapa_atendimento NOT IN ('expedicao_realizada','perdido','reativacao');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 7) REATIVAÇÃO
CREATE OR REPLACE VIEW public.vw_leads_reativacao AS
SELECT l.id AS lead_id, l.nome, l.telefone, l.email,
       l.etapa_atendimento, l.ultima_interacao_at, l.updated_at,
       CASE
         WHEN l.etapa_atendimento = 'expedicao_realizada'
              AND COALESCE(l.updated_at, l.created_at) < (now() - interval '6 months') THEN 'cliente_antigo'
         WHEN l.etapa_atendimento NOT IN ('reserva_confirmada','perdido','reativacao','expedicao_realizada')
              AND COALESCE(l.ultima_interacao_at, l.updated_at, l.created_at) < (now() - interval '90 days') THEN 'lead_inativo'
         ELSE NULL
       END AS motivo_reativacao
FROM public.leads l
WHERE (
  (l.etapa_atendimento = 'expedicao_realizada' AND COALESCE(l.updated_at, l.created_at) < (now() - interval '6 months'))
  OR
  (l.etapa_atendimento NOT IN ('reserva_confirmada','perdido','reativacao','expedicao_realizada')
   AND COALESCE(l.ultima_interacao_at, l.updated_at, l.created_at) < (now() - interval '90 days'))
);

GRANT SELECT ON public.vw_leads_reativacao TO authenticated, service_role;

-- 8) ALERTA IA NÃO INICIOU EM 5 MIN
CREATE OR REPLACE FUNCTION public.alertar_ia_atendimento_atrasado()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT l.id, l.nome
    FROM public.leads l
    WHERE l.etapa_atendimento = 'novo'
      AND l.created_at < (now() - interval '5 minutes')
      AND NOT EXISTS (
        SELECT 1 FROM public.lead_conversas c
        WHERE c.lead_id = l.id AND c.tipo_evento IN ('mensagem_enviada','mensagem_ia','ia_iniciou_atendimento')
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.tarefas t
        WHERE t.lead_id = l.id AND t.titulo ILIKE 'IA não iniciou%' AND t.status <> 'concluida'
      )
  LOOP
    PERFORM public.criar_tarefa_idempotente(
      'IA não iniciou atendimento para ' || COALESCE(r.nome,'(sem nome)') || ' em 5 minutos',
      'atendimento','sistema','alta',
      r.id, NULL, NULL, INTERVAL '1 hour');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
