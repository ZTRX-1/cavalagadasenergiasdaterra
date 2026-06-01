
-- ============================================================
-- FASE A — Expansão CRM de Leads
-- ============================================================

-- 1) Novos campos em leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS etapa_atendimento text NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS nivel_interesse smallint NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS lead_score smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid,
  ADD COLUMN IF NOT EXISTS resumo_atendimento text,
  ADD COLUMN IF NOT EXISTS resumo_ia text,
  ADD COLUMN IF NOT EXISTS proxima_acao text,
  ADD COLUMN IF NOT EXISTS ultima_interacao_at timestamptz,
  ADD COLUMN IF NOT EXISTS data_interesse date,
  ADD COLUMN IF NOT EXISTS canal_entrada text,
  ADD COLUMN IF NOT EXISTS canal_atendimento text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;

-- Constraints de domínio
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_etapa_chk,
  ADD CONSTRAINT leads_etapa_chk CHECK (etapa_atendimento IN (
    'novo','em_atendimento','qualificado','interessado',
    'pronto_reserva','encaminhado_financeiro','pago','perdido'
  ));

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_nivel_interesse_chk,
  ADD CONSTRAINT leads_nivel_interesse_chk CHECK (nivel_interesse BETWEEN 1 AND 5);

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_lead_score_chk,
  ADD CONSTRAINT leads_lead_score_chk CHECK (lead_score BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS leads_etapa_idx ON public.leads (etapa_atendimento);
CREATE INDEX IF NOT EXISTS leads_responsavel_idx ON public.leads (responsavel_id);
CREATE INDEX IF NOT EXISTS leads_lead_score_idx ON public.leads (lead_score DESC);

-- ============================================================
-- 2) lead_conversas — timeline de interações
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  tipo_evento text NOT NULL DEFAULT 'observacao_interna',
  conteudo text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  autor_id uuid,
  autor_nome text,
  direcao text,
  canal text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_conversas
  DROP CONSTRAINT IF EXISTS lead_conversas_tipo_chk,
  ADD CONSTRAINT lead_conversas_tipo_chk CHECK (tipo_evento IN (
    'mensagem_ia','mensagem_humana','ligacao','pagamento',
    'contrato','alteracao_status','observacao_interna','email','sistema'
  ));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_conversas TO authenticated;
GRANT ALL ON public.lead_conversas TO service_role;

ALTER TABLE public.lead_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam lead_conversas"
  ON public.lead_conversas FOR ALL TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

CREATE INDEX IF NOT EXISTS lead_conversas_lead_idx ON public.lead_conversas (lead_id, created_at DESC);

-- ============================================================
-- 3) lead_memoria — memória conversacional pra IA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_memoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE,
  perfil text,
  objetivos text,
  interesses text,
  restricoes text,
  expedicoes_favoritas jsonb NOT NULL DEFAULT '[]'::jsonb,
  orcamento numeric,
  dados_extraidos jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultima_atualizacao timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_memoria TO authenticated;
GRANT ALL ON public.lead_memoria TO service_role;

ALTER TABLE public.lead_memoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam lead_memoria"
  ON public.lead_memoria FOR ALL TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

-- ============================================================
-- 4) webhooks_eventos — fila pra automações futuras
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhooks_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pendente',
  tentativas int NOT NULL DEFAULT 0,
  ultimo_erro text,
  processado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks_eventos
  DROP CONSTRAINT IF EXISTS webhooks_eventos_status_chk,
  ADD CONSTRAINT webhooks_eventos_status_chk CHECK (status IN ('pendente','enviado','falhou','ignorado'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks_eventos TO authenticated;
GRANT ALL ON public.webhooks_eventos TO service_role;

ALTER TABLE public.webhooks_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam webhooks_eventos"
  ON public.webhooks_eventos FOR ALL TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

CREATE INDEX IF NOT EXISTS webhooks_eventos_status_idx ON public.webhooks_eventos (status, created_at);

-- ============================================================
-- 5) Trigger: emite webhook_evento ao mudar etapa do lead
--    + atualiza ultima_interacao_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.lead_etapa_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('lead_criado','lead', NEW.id, jsonb_build_object('nome', NEW.nome, 'origem', NEW.origem, 'etapa', NEW.etapa_atendimento));
    RETURN NEW;
  END IF;

  IF NEW.etapa_atendimento IS DISTINCT FROM OLD.etapa_atendimento THEN
    INSERT INTO public.lead_conversas (lead_id, tipo_evento, conteudo, metadata)
    VALUES (NEW.id, 'alteracao_status',
      'Etapa alterada: ' || OLD.etapa_atendimento || ' → ' || NEW.etapa_atendimento,
      jsonb_build_object('de', OLD.etapa_atendimento, 'para', NEW.etapa_atendimento));

    IF NEW.etapa_atendimento = 'qualificado' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_qualificado','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'pronto_reserva' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_pronto_reserva','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'pago' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_pago','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    END IF;

    NEW.ultima_interacao_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_etapa_trigger ON public.leads;
CREATE TRIGGER leads_etapa_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.lead_etapa_changed();

-- ============================================================
-- 6) Trigger: registra conversa quando uma nova conversa é inserida
--    atualiza ultima_interacao_at no lead
-- ============================================================
CREATE OR REPLACE FUNCTION public.lead_conversa_inserida()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET ultima_interacao_at = NEW.created_at
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_conversas_touch ON public.lead_conversas;
CREATE TRIGGER lead_conversas_touch
  AFTER INSERT ON public.lead_conversas
  FOR EACH ROW EXECUTE FUNCTION public.lead_conversa_inserida();

-- ============================================================
-- 7) Backfill: migrar status existente → etapa_atendimento
-- ============================================================
UPDATE public.leads SET etapa_atendimento =
  CASE
    WHEN status = 'novo' THEN 'novo'
    WHEN status IN ('em_contato','contato') THEN 'em_atendimento'
    WHEN status = 'qualificado' THEN 'qualificado'
    WHEN status IN ('ganho','convertido') THEN 'pago'
    WHEN status = 'perdido' THEN 'perdido'
    ELSE 'novo'
  END
WHERE etapa_atendimento = 'novo';
