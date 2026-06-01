
-- ============ RESERVAS: novos campos =============
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS status_financeiro text NOT NULL DEFAULT 'aguardando_pagamento',
  ADD COLUMN IF NOT EXISTS status_operacional text NOT NULL DEFAULT 'pre_reserva',
  ADD COLUMN IF NOT EXISTS valor_entrada numeric,
  ADD COLUMN IF NOT EXISTS contrato_enviado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contrato_assinado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contrato_enviado_em timestamptz,
  ADD COLUMN IF NOT EXISTS contrato_assinado_em timestamptz,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid,
  ADD COLUMN IF NOT EXISTS observacoes_internas text,
  ADD COLUMN IF NOT EXISTS lead_id uuid,
  ADD COLUMN IF NOT EXISTS cliente_nome text,
  ADD COLUMN IF NOT EXISTS cliente_email text,
  ADD COLUMN IF NOT EXISTS cliente_telefone text,
  ADD COLUMN IF NOT EXISTS cliente_cpf text;

-- backfill cliente_* a partir do jsonb responsavel quando vazio
UPDATE public.reservas
SET cliente_nome = COALESCE(cliente_nome, responsavel->>'nome'),
    cliente_email = COALESCE(cliente_email, responsavel->>'email'),
    cliente_telefone = COALESCE(cliente_telefone, responsavel->>'telefone'),
    cliente_cpf = COALESCE(cliente_cpf, responsavel->>'cpf')
WHERE responsavel IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservas_expedicao ON public.reservas(expedicao_id);
CREATE INDEX IF NOT EXISTS idx_reservas_lead ON public.reservas(lead_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status_fin ON public.reservas(status_financeiro);
CREATE INDEX IF NOT EXISTS idx_reservas_status_op ON public.reservas(status_operacional);

-- ============ PAGAMENTOS =============
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  expedicao_id uuid,
  cliente_nome text,
  tipo text NOT NULL DEFAULT 'entrada', -- entrada, parcela, final, reembolso, ajuste
  forma text NOT NULL DEFAULT 'pix',    -- pix, cartao, transferencia, dinheiro, boleto
  valor numeric NOT NULL,
  parcela_atual smallint,
  parcela_total smallint,
  status text NOT NULL DEFAULT 'confirmado', -- previsto, confirmado, estornado, cancelado
  data_prevista date,
  data_pagamento date,
  comprovante_url text,
  observacoes text,
  registrado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam pagamentos" ON public.pagamentos
  FOR ALL TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pagamentos_reserva ON public.pagamentos(reserva_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_expedicao ON public.pagamentos(expedicao_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);

CREATE TRIGGER trg_pagamentos_updated
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DESPESAS: previsto x realizado =============
ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS previsto boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_custo text NOT NULL DEFAULT 'variavel'; -- fixo, variavel, comissao

CREATE INDEX IF NOT EXISTS idx_despesas_expedicao ON public.despesas(expedicao_id);
CREATE INDEX IF NOT EXISTS idx_despesas_previsto ON public.despesas(previsto);

-- ============ DOCUMENTOS DA RESERVA =============
CREATE TABLE IF NOT EXISTS public.reserva_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'contrato', -- contrato, comprovante, identidade, outro
  titulo text NOT NULL,
  url text,
  status text NOT NULL DEFAULT 'pendente', -- pendente, enviado, assinado, recusado
  enviado_em timestamptz,
  assinado_em timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reserva_documentos TO authenticated;
GRANT ALL ON public.reserva_documentos TO service_role;

ALTER TABLE public.reserva_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam reserva_documentos" ON public.reserva_documentos
  FOR ALL TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reserva_documentos_reserva ON public.reserva_documentos(reserva_id);

CREATE TRIGGER trg_reserva_documentos_updated
  BEFORE UPDATE ON public.reserva_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HISTÓRICO FINANCEIRO/OPERACIONAL DA RESERVA =============
CREATE TABLE IF NOT EXISTS public.reserva_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- pagamento, status_financeiro, status_operacional, contrato, documento, observacao, criacao
  descricao text NOT NULL,
  valor numeric,
  autor_id uuid,
  autor_nome text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reserva_historico TO authenticated;
GRANT ALL ON public.reserva_historico TO service_role;

ALTER TABLE public.reserva_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam reserva_historico" ON public.reserva_historico
  FOR ALL TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reserva_historico_reserva ON public.reserva_historico(reserva_id);

-- ============ TRIGGERS DE HISTÓRICO =============
CREATE OR REPLACE FUNCTION public.reserva_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.id, 'criacao', 'Reserva criada: ' || NEW.protocolo,
      jsonb_build_object('protocolo', NEW.protocolo, 'expedicao', NEW.expedicao_nome));
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('reserva_criada', 'reserva', NEW.id,
      jsonb_build_object('protocolo', NEW.protocolo, 'expedicao_id', NEW.expedicao_id, 'valor_total', NEW.valor_total));
    RETURN NEW;
  END IF;

  IF NEW.status_financeiro IS DISTINCT FROM OLD.status_financeiro THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.id, 'status_financeiro',
      'Status financeiro: ' || OLD.status_financeiro || ' → ' || NEW.status_financeiro,
      jsonb_build_object('de', OLD.status_financeiro, 'para', NEW.status_financeiro));

    IF NEW.status_financeiro = 'pago_integralmente' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('pagamento_confirmado', 'reserva', NEW.id,
        jsonb_build_object('protocolo', NEW.protocolo, 'valor_pago', NEW.valor_pago));
    END IF;
  END IF;

  IF NEW.status_operacional IS DISTINCT FROM OLD.status_operacional THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.id, 'status_operacional',
      'Status operacional: ' || OLD.status_operacional || ' → ' || NEW.status_operacional,
      jsonb_build_object('de', OLD.status_operacional, 'para', NEW.status_operacional));
  END IF;

  IF NEW.contrato_enviado IS DISTINCT FROM OLD.contrato_enviado AND NEW.contrato_enviado THEN
    NEW.contrato_enviado_em := COALESCE(NEW.contrato_enviado_em, now());
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao)
    VALUES (NEW.id, 'contrato', 'Contrato enviado ao cliente');
  END IF;

  IF NEW.contrato_assinado IS DISTINCT FROM OLD.contrato_assinado AND NEW.contrato_assinado THEN
    NEW.contrato_assinado_em := COALESCE(NEW.contrato_assinado_em, now());
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao)
    VALUES (NEW.id, 'contrato', 'Contrato assinado pelo cliente');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reserva_status_changed ON public.reservas;
CREATE TRIGGER trg_reserva_status_changed
  BEFORE INSERT OR UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.reserva_status_changed();

-- Trigger pagamento → histórico + atualiza saldo da reserva
CREATE OR REPLACE FUNCTION public.pagamento_registrado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_pago numeric;
  v_valor_total numeric;
  v_status text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, valor, metadata)
    VALUES (NEW.reserva_id, 'pagamento',
      'Pagamento ' || NEW.tipo || ' (' || NEW.forma || '): R$ ' || NEW.valor::text,
      NEW.valor,
      jsonb_build_object('tipo', NEW.tipo, 'forma', NEW.forma, 'status', NEW.status));
  END IF;

  -- Recalcula saldo da reserva considerando pagamentos confirmados
  SELECT COALESCE(SUM(valor), 0) INTO v_total_pago
  FROM public.pagamentos
  WHERE reserva_id = NEW.reserva_id AND status = 'confirmado' AND tipo <> 'reembolso';

  SELECT valor_total INTO v_valor_total FROM public.reservas WHERE id = NEW.reserva_id;

  v_status := CASE
    WHEN v_valor_total IS NULL OR v_valor_total = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago >= v_valor_total THEN 'pago_integralmente'
    WHEN v_total_pago < v_valor_total THEN 'parcialmente_pago'
    ELSE 'aguardando_pagamento'
  END;

  UPDATE public.reservas
  SET valor_pago = v_total_pago,
      saldo_restante = COALESCE(v_valor_total,0) - v_total_pago,
      status_financeiro = v_status,
      updated_at = now()
  WHERE id = NEW.reserva_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pagamento_registrado ON public.pagamentos;
CREATE TRIGGER trg_pagamento_registrado
  AFTER INSERT OR UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.pagamento_registrado();

-- ============ VIEW: indicadores por expedição =============
CREATE OR REPLACE VIEW public.expedicao_indicadores AS
SELECT
  e.id AS expedicao_id,
  e.nome AS expedicao_nome,
  e.slug,
  COALESCE(SUM(d.vagas_total), 0)::int AS vagas_totais,
  COALESCE(SUM(d.vagas_total - d.vagas_disponiveis), 0)::int AS vagas_ocupadas,
  COALESCE(SUM(d.vagas_disponiveis), 0)::int AS vagas_disponiveis,
  COALESCE(r.receita_prevista, 0) AS receita_prevista,
  COALESCE(r.receita_recebida, 0) AS receita_recebida,
  COALESCE(r.valor_pendente, 0) AS valor_pendente,
  COALESCE(c.custos_previstos, 0) AS custos_previstos,
  COALESCE(c.custos_realizados, 0) AS custos_realizados,
  (COALESCE(r.receita_prevista, 0) - COALESCE(c.custos_previstos, 0) - COALESCE(c.custos_realizados, 0)) AS lucro_estimado,
  (COALESCE(r.receita_recebida, 0) - COALESCE(c.custos_realizados, 0)) AS lucro_realizado,
  COALESCE(r.participantes_confirmados, 0) AS participantes_confirmados,
  COALESCE(r.participantes_pendentes, 0) AS participantes_pendentes
FROM public.expedicoes e
LEFT JOIN public.datas d ON d.expedicao_id = e.id
LEFT JOIN LATERAL (
  SELECT
    SUM(valor_total) AS receita_prevista,
    SUM(valor_pago) AS receita_recebida,
    SUM(GREATEST(COALESCE(valor_total,0) - COALESCE(valor_pago,0), 0)) AS valor_pendente,
    SUM(CASE WHEN status_operacional IN ('participante_confirmado','participante_embarcado','expedicao_concluida') THEN quantidade_participantes ELSE 0 END) AS participantes_confirmados,
    SUM(CASE WHEN status_operacional IN ('pre_reserva','reserva_confirmada') THEN quantidade_participantes ELSE 0 END) AS participantes_pendentes
  FROM public.reservas
  WHERE expedicao_id = e.id AND status NOT IN ('cancelado')
) r ON true
LEFT JOIN LATERAL (
  SELECT
    SUM(CASE WHEN previsto THEN valor ELSE 0 END) AS custos_previstos,
    SUM(CASE WHEN NOT previsto THEN valor ELSE 0 END) AS custos_realizados
  FROM public.despesas
  WHERE expedicao_id = e.id
) c ON true
GROUP BY e.id, e.nome, e.slug, r.receita_prevista, r.receita_recebida, r.valor_pendente,
         r.participantes_confirmados, r.participantes_pendentes, c.custos_previstos, c.custos_realizados;

GRANT SELECT ON public.expedicao_indicadores TO authenticated;
GRANT SELECT ON public.expedicao_indicadores TO service_role;
