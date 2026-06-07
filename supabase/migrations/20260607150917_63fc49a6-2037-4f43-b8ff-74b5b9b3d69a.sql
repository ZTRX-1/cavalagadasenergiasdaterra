
-- 1. Novos campos em leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS temperatura_lead text NOT NULL DEFAULT 'frio',
  ADD COLUMN IF NOT EXISTS status_atendimento text NOT NULL DEFAULT 'ia',
  ADD COLUMN IF NOT EXISTS motivo_perda text,
  ADD COLUMN IF NOT EXISTS motivo_perda_detalhe text,
  ADD COLUMN IF NOT EXISTS expedicao_id uuid,
  ADD COLUMN IF NOT EXISTS data_expedicao_id uuid;

-- Constraints leves (não-quebráveis)
DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT leads_temperatura_chk
    CHECK (temperatura_lead IN ('frio','morno','quente','urgente'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT leads_status_atend_chk
    CHECK (status_atendimento IN ('ia','humano','transferido','encerrado'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT leads_motivo_perda_chk
    CHECK (motivo_perda IS NULL OR motivo_perda IN ('preco','data','sem_disponibilidade','nao_respondeu','concorrente','outro'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Estende trigger de etapa para também logar temperatura e status_atendimento
CREATE OR REPLACE FUNCTION public.lead_etapa_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('lead_criado','lead', NEW.id, jsonb_build_object('nome', NEW.nome, 'origem', NEW.origem, 'etapa', NEW.etapa_atendimento));
    -- registra timeline de criação
    INSERT INTO public.lead_conversas (lead_id, tipo_evento, conteudo, metadata)
    VALUES (NEW.id, 'lead_criado',
      'Lead criado' || COALESCE(' via ' || NEW.origem, ''),
      jsonb_build_object('origem', NEW.origem, 'canal_entrada', NEW.canal_entrada));
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
    ELSIF NEW.etapa_atendimento = 'convertido' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_convertido','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'perdido' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_perdido','lead', NEW.id, jsonb_build_object('nome', NEW.nome, 'motivo', NEW.motivo_perda));
    END IF;

    NEW.ultima_interacao_at := now();
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.temperatura_lead IS DISTINCT FROM OLD.temperatura_lead THEN
    INSERT INTO public.lead_conversas (lead_id, tipo_evento, conteudo, metadata)
    VALUES (NEW.id, 'alteracao_temperatura',
      'Temperatura: ' || OLD.temperatura_lead || ' → ' || NEW.temperatura_lead,
      jsonb_build_object('de', OLD.temperatura_lead, 'para', NEW.temperatura_lead));
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status_atendimento IS DISTINCT FROM OLD.status_atendimento THEN
    INSERT INTO public.lead_conversas (lead_id, tipo_evento, conteudo, metadata)
    VALUES (NEW.id, CASE WHEN NEW.status_atendimento = 'humano' THEN 'transferido_humano' ELSE 'alteracao_status' END,
      'Atendimento: ' || OLD.status_atendimento || ' → ' || NEW.status_atendimento,
      jsonb_build_object('de', OLD.status_atendimento, 'para', NEW.status_atendimento));

    IF NEW.status_atendimento = 'humano' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_transferido_humano','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Garante triggers (BEFORE INSERT força etapa novo, AFTER INSERT/UPDATE faz histórico)
DROP TRIGGER IF EXISTS lead_etapa_changed_trg ON public.leads;
CREATE TRIGGER lead_etapa_changed_trg
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.lead_etapa_changed();
