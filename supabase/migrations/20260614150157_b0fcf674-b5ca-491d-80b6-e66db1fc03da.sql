
-- ============================================================
-- FASE 1 — Estabilização Operacional
-- ============================================================

-- ------------------------------------------------------------
-- 1) MULTI-MOEDA
-- ------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expedicoes' AND column_name='moeda') THEN
    ALTER TABLE public.expedicoes ADD COLUMN moeda text NOT NULL DEFAULT 'BRL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='datas' AND column_name='moeda') THEN
    ALTER TABLE public.datas ADD COLUMN moeda text NOT NULL DEFAULT 'BRL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='moeda') THEN
    ALTER TABLE public.leads ADD COLUMN moeda text NOT NULL DEFAULT 'BRL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pagamentos' AND column_name='moeda') THEN
    ALTER TABLE public.pagamentos ADD COLUMN moeda text NOT NULL DEFAULT 'BRL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='moeda') THEN
    ALTER TABLE public.contas_pagar ADD COLUMN moeda text NOT NULL DEFAULT 'BRL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='moeda') THEN
    ALTER TABLE public.contas_receber ADD COLUMN moeda text NOT NULL DEFAULT 'BRL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='despesas' AND column_name='moeda') THEN
    ALTER TABLE public.despesas ADD COLUMN moeda text NOT NULL DEFAULT 'BRL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservas' AND column_name='tem_pagamento_moeda_divergente') THEN
    ALTER TABLE public.reservas ADD COLUMN tem_pagamento_moeda_divergente boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Restrições de moeda (apenas BRL/USD/EUR)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['expedicoes','datas','leads','pagamentos','contas_pagar','contas_receber','despesas','reservas']) LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS chk_%I_moeda', t, t);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT chk_%I_moeda CHECK (moeda IN (''BRL'',''USD'',''EUR''))', t, t);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 2) FUNÇÃO ÚNICA DE VAGAS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalcular_vagas_data(p_data_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ocupadas int;
  v_total int;
BEGIN
  IF p_data_id IS NULL THEN RETURN; END IF;

  SELECT count(*) INTO v_ocupadas
  FROM public.participantes
  WHERE data_id = p_data_id
    AND status IN ('pendente','confirmado');

  SELECT vagas_total INTO v_total FROM public.datas WHERE id = p_data_id;

  UPDATE public.datas
  SET vagas_disponiveis = GREATEST(0, COALESCE(v_total,0) - v_ocupadas),
      updated_at = now()
  WHERE id = p_data_id;
END $$;

CREATE OR REPLACE FUNCTION public.trg_recalcular_vagas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.recalcular_vagas_data(COALESCE(NEW.data_id, OLD.data_id));
  IF TG_OP = 'UPDATE' AND NEW.data_id IS DISTINCT FROM OLD.data_id THEN
    PERFORM public.recalcular_vagas_data(OLD.data_id);
  END IF;
  RETURN NULL;
END $$;

-- Remove triggers e funções concorrentes de vagas
DROP TRIGGER IF EXISTS tr_atualizar_vagas_disponiveis ON public.participantes;
DROP TRIGGER IF EXISTS tr_atualizar_vagas_reserva ON public.reservas;
DROP FUNCTION IF EXISTS public.atualizar_vagas_disponiveis() CASCADE;
DROP FUNCTION IF EXISTS public.atualizar_vagas_expedicao() CASCADE;

-- Trigger único, oficial
DROP TRIGGER IF EXISTS tr_recalcular_vagas ON public.participantes;
CREATE TRIGGER tr_recalcular_vagas
AFTER INSERT OR UPDATE OR DELETE ON public.participantes
FOR EACH ROW EXECUTE FUNCTION public.trg_recalcular_vagas();

-- ------------------------------------------------------------
-- 3) PARTICIPANTES — FONTE ÚNICA (remove sync tabela→JSON e simplifica reserva→participantes)
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_sync_participante_to_reserva_json ON public.participantes;
DROP FUNCTION IF EXISTS public.fn_sync_participante_to_reserva_json() CASCADE;

-- Simplifica fn_master_sync_participantes:
-- Apenas sincroniza status dos participantes quando o status da reserva muda.
-- Nunca lê o JSON. Não cria/atualiza linhas a partir do JSON.
CREATE OR REPLACE FUNCTION public.fn_master_sync_participantes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status_participante text;
BEGIN
  IF NEW.status = 'cancelado' OR NEW.status_operacional IN ('cancelada','reembolsada','excluida') THEN
    v_status_participante := 'cancelado';
  ELSIF NEW.status_operacional IN ('reserva_confirmada','participante_confirmado') OR NEW.status_financeiro = 'pago_integralmente' THEN
    v_status_participante := 'confirmado';
  ELSE
    v_status_participante := 'pendente';
  END IF;

  IF TG_OP = 'UPDATE' AND
     (OLD.status IS DISTINCT FROM NEW.status
      OR OLD.status_operacional IS DISTINCT FROM NEW.status_operacional
      OR OLD.status_financeiro IS DISTINCT FROM NEW.status_financeiro) THEN
    UPDATE public.participantes
    SET status = v_status_participante,
        updated_at = now(),
        status_changed_at = now()
    WHERE reserva_id = NEW.id AND status IS DISTINCT FROM v_status_participante;
  END IF;

  -- Sincroniza expedicao_id / data_id se forem alterados na reserva
  IF TG_OP = 'UPDATE' AND
     (OLD.expedicao_id IS DISTINCT FROM NEW.expedicao_id OR OLD.data_id IS DISTINCT FROM NEW.data_id) THEN
    UPDATE public.participantes
    SET expedicao_id = NEW.expedicao_id,
        data_id = NEW.data_id,
        updated_at = now()
    WHERE reserva_id = NEW.id;
  END IF;

  RETURN NEW;
END $$;

-- Documenta que o campo JSON é legado
COMMENT ON COLUMN public.reservas.participantes IS
  'LEGADO — preservado apenas para histórico/auditoria. Fonte de verdade: tabela public.participantes.';

-- Remove sync redundante reserva→lead que dependia de mudanças no JSON
DROP TRIGGER IF EXISTS tr_sync_reserva_to_lead_summary ON public.reservas;

-- ------------------------------------------------------------
-- 4) LIMPEZA DE TRIGGERS DUPLICADOS
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS datas_updated_at ON public.datas;
DROP TRIGGER IF EXISTS expedicoes_updated_at ON public.expedicoes;
DROP TRIGGER IF EXISTS update_configuracoes_updated_at ON public.configuracoes;
DROP TRIGGER IF EXISTS trg_documento_central_evento ON public.documentos_central;
DROP TRIGGER IF EXISTS lead_conversas_touch ON public.lead_conversas;
DROP TRIGGER IF EXISTS lead_etapa_changed_trg ON public.leads;
DROP TRIGGER IF EXISTS participantes_updated_at ON public.participantes;

-- ------------------------------------------------------------
-- 5) PAGAMENTOS — herdar moeda da reserva e marcar divergência
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pagamento_registrado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_pago numeric;
  v_valor_total numeric;
  v_moeda_reserva text;
  v_status text;
  v_status_anterior text;
  v_tem_divergente boolean;
BEGIN
  -- Herda moeda da reserva se não veio explícita
  SELECT moeda, valor_total, status_financeiro
    INTO v_moeda_reserva, v_valor_total, v_status_anterior
  FROM public.reservas WHERE id = NEW.reserva_id;

  IF TG_OP = 'INSERT' AND (NEW.moeda IS NULL OR NEW.moeda = '') THEN
    NEW.moeda := COALESCE(v_moeda_reserva, 'BRL');
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, valor, metadata)
    VALUES (NEW.reserva_id, 'pagamento',
      'Pagamento ' || NEW.tipo || ' (' || NEW.forma || '): ' || NEW.moeda || ' ' || NEW.valor::text,
      NEW.valor,
      jsonb_build_object('tipo', NEW.tipo, 'forma', NEW.forma, 'status', NEW.status, 'moeda', NEW.moeda));

    IF NEW.status = 'confirmado' AND NEW.tipo <> 'reembolso' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('pagamento_recebido','pagamento', NEW.id,
        jsonb_build_object('reserva_id', NEW.reserva_id, 'tipo', NEW.tipo, 'forma', NEW.forma, 'valor', NEW.valor, 'moeda', NEW.moeda));
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'confirmado' AND NEW.tipo <> 'reembolso' THEN
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('pagamento_recebido','pagamento', NEW.id,
      jsonb_build_object('reserva_id', NEW.reserva_id, 'tipo', NEW.tipo, 'forma', NEW.forma, 'valor', NEW.valor, 'moeda', NEW.moeda));
  END IF;

  -- Soma apenas pagamentos na mesma moeda da reserva
  SELECT COALESCE(SUM(valor), 0) INTO v_total_pago
  FROM public.pagamentos
  WHERE reserva_id = NEW.reserva_id
    AND status = 'confirmado'
    AND tipo <> 'reembolso'
    AND moeda = COALESCE(v_moeda_reserva,'BRL');

  -- Detecta divergência (existe pagamento confirmado em outra moeda)
  SELECT EXISTS (
    SELECT 1 FROM public.pagamentos
    WHERE reserva_id = NEW.reserva_id
      AND status = 'confirmado'
      AND tipo <> 'reembolso'
      AND moeda <> COALESCE(v_moeda_reserva,'BRL')
  ) INTO v_tem_divergente;

  v_status := CASE
    WHEN v_valor_total IS NULL OR v_valor_total = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago = 0 THEN 'aguardando_pagamento'
    WHEN v_total_pago >= v_valor_total THEN 'pago_integralmente'
    WHEN v_total_pago < v_valor_total THEN 'parcialmente_pago'
    ELSE 'aguardando_pagamento'
  END;

  UPDATE public.reservas
  SET valor_pago = v_total_pago,
      status_financeiro = v_status,
      tem_pagamento_moeda_divergente = v_tem_divergente,
      updated_at = now()
  WHERE id = NEW.reserva_id;

  IF v_status = 'pago_integralmente' AND v_status_anterior IS DISTINCT FROM 'pago_integralmente' THEN
    UPDATE public.participantes
    SET status = 'confirmado', updated_at = now()
    WHERE reserva_id = NEW.reserva_id AND status <> 'confirmado';

    INSERT INTO public.reserva_historico (reserva_id, tipo, descricao, metadata)
    VALUES (NEW.reserva_id, 'participantes_confirmados',
      'Reserva quitada — participantes marcados como confirmados',
      jsonb_build_object('total_pago', v_total_pago, 'moeda', v_moeda_reserva));
  END IF;

  RETURN NEW;
END $$;

-- ------------------------------------------------------------
-- 6) ÍNDICES DE JORNADA
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reservas_lead_id ON public.reservas(lead_id);
CREATE INDEX IF NOT EXISTS idx_reservas_data_id ON public.reservas(data_id);
CREATE INDEX IF NOT EXISTS idx_reservas_expedicao_id ON public.reservas(expedicao_id);
CREATE INDEX IF NOT EXISTS idx_participantes_reserva_id ON public.participantes(reserva_id);
CREATE INDEX IF NOT EXISTS idx_participantes_data_id ON public.participantes(data_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_reserva_id ON public.pagamentos(reserva_id);
CREATE INDEX IF NOT EXISTS idx_leads_expedicao_id ON public.leads(expedicao_id);

-- ------------------------------------------------------------
-- 7) VIEW DE CONSISTÊNCIA DA JORNADA
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_jornada_consistencia AS
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

-- ------------------------------------------------------------
-- 8) FUNDAÇÃO IA (Bárbara) — schema only
-- ------------------------------------------------------------

-- IA_INTERACOES
CREATE TABLE IF NOT EXISTS public.ia_interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  reserva_id uuid REFERENCES public.reservas(id) ON DELETE SET NULL,
  canal text NOT NULL DEFAULT 'whatsapp',
  direcao text NOT NULL CHECK (direcao IN ('in','out')),
  conteudo text,
  modelo text,
  tokens_in int,
  tokens_out int,
  intent text,
  confidence numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_interacoes TO authenticated;
GRANT ALL ON public.ia_interacoes TO service_role;
ALTER TABLE public.ia_interacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internos gerenciam interacoes IA" ON public.ia_interacoes
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_ia_interacoes_lead ON public.ia_interacoes(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ia_interacoes_reserva ON public.ia_interacoes(reserva_id, created_at DESC);

-- IA_HANDOFF_QUEUE
CREATE TABLE IF NOT EXISTS public.ia_handoff_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  reserva_id uuid REFERENCES public.reservas(id) ON DELETE SET NULL,
  motivo text NOT NULL,
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','critica')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_atendimento','resolvido','descartado')),
  atribuido_para uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notas text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  resolvido_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_handoff_queue TO authenticated;
GRANT ALL ON public.ia_handoff_queue TO service_role;
ALTER TABLE public.ia_handoff_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internos gerenciam handoff" ON public.ia_handoff_queue
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_ia_handoff_status ON public.ia_handoff_queue(status, prioridade);

-- IA_KNOWLEDGE_BASE
CREATE TABLE IF NOT EXISTS public.ia_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  conteudo text NOT NULL,
  categoria text,
  tags text[] NOT NULL DEFAULT '{}',
  versao int NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  embedding_jsonb jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_knowledge_base TO authenticated;
GRANT ALL ON public.ia_knowledge_base TO service_role;
ALTER TABLE public.ia_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internos gerenciam KB" ON public.ia_knowledge_base
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE TRIGGER trg_ia_kb_updated BEFORE UPDATE ON public.ia_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_ia_kb_categoria ON public.ia_knowledge_base(categoria) WHERE ativo;

-- TAREFAS
CREATE TABLE IF NOT EXISTS public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'geral',
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','critica')),
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','em_andamento','concluida','cancelada')),
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  reserva_id uuid REFERENCES public.reservas(id) ON DELETE SET NULL,
  due_at timestamptz,
  concluida_em timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefas TO authenticated;
GRANT ALL ON public.tarefas TO service_role;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internos gerenciam tarefas" ON public.tarefas
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE TRIGGER trg_tarefas_updated BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status, prioridade);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON public.tarefas(responsavel_id) WHERE status <> 'concluida';

-- MENSAGENS_CANAL
CREATE TABLE IF NOT EXISTS public.mensagens_canal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal text NOT NULL CHECK (canal IN ('whatsapp','email','instagram','site','sms','telefone','outro')),
  direcao text NOT NULL CHECK (direcao IN ('in','out')),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  reserva_id uuid REFERENCES public.reservas(id) ON DELETE SET NULL,
  remetente text,
  destinatario text,
  conteudo text,
  status text NOT NULL DEFAULT 'enviada',
  externo_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens_canal TO authenticated;
GRANT ALL ON public.mensagens_canal TO service_role;
ALTER TABLE public.mensagens_canal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internos gerenciam mensagens" ON public.mensagens_canal
  FOR ALL TO authenticated
  USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_mensagens_lead ON public.mensagens_canal(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_reserva ON public.mensagens_canal(reserva_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_canal ON public.mensagens_canal(canal, created_at DESC);

-- ------------------------------------------------------------
-- 9) RECÁLCULO INICIAL DE VAGAS (consistência imediata)
-- ------------------------------------------------------------
DO $$
DECLARE d_id uuid;
BEGIN
  FOR d_id IN SELECT id FROM public.datas LOOP
    PERFORM public.recalcular_vagas_data(d_id);
  END LOOP;
END $$;
