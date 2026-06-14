
-- ============================================================
-- FASE 1 — Correções de homologação (Blocos A, B, D)
-- ============================================================

-- ---------- BLOCO A: Funil de leads ----------
-- Backfill etapas antigas para as novas
UPDATE public.leads SET etapa_atendimento = 'triagem_ia'        WHERE etapa_atendimento = 'em_atendimento';
UPDATE public.leads SET etapa_atendimento = 'qualificado'       WHERE etapa_atendimento = 'interessado';
UPDATE public.leads SET etapa_atendimento = 'reserva_pendente'  WHERE etapa_atendimento = 'pronto_reserva';
UPDATE public.leads SET etapa_atendimento = 'participante_confirmado' WHERE etapa_atendimento IN ('encaminhado_financeiro','pago');

-- Drop e recria CHECK constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_etapa_chk;
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_etapa_atendimento_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_etapa_chk CHECK (
  etapa_atendimento IN (
    'novo','triagem_ia','qualificado','proposta_enviada',
    'reserva_pendente','participante_confirmado','convertido',
    'concluido','perdido'
  )
);

-- Atualiza trigger lead_etapa_changed com nomes novos
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
    ELSIF NEW.etapa_atendimento = 'proposta_enviada' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_proposta_enviada','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'reserva_pendente' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_reserva_pendente','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'participante_confirmado' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_participante_confirmado','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'convertido' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_convertido','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'concluido' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_concluido','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
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

-- ---------- BLOCO B: Multi-moeda ----------
-- Backfill: herda moeda da expedição
UPDATE public.datas d
SET moeda = e.moeda
FROM public.expedicoes e
WHERE d.expedicao_id = e.id
  AND e.moeda IS NOT NULL
  AND (d.moeda IS DISTINCT FROM e.moeda);

UPDATE public.reservas r
SET moeda = COALESCE(d.moeda, e.moeda, 'BRL')
FROM public.expedicoes e
LEFT JOIN public.datas d ON d.expedicao_id = e.id
WHERE r.expedicao_id = e.id
  AND (r.data_id IS NULL OR r.data_id = d.id)
  AND (r.moeda IS DISTINCT FROM COALESCE(d.moeda, e.moeda, 'BRL'));

UPDATE public.pagamentos p
SET moeda = r.moeda
FROM public.reservas r
WHERE p.reserva_id = r.id
  AND r.moeda IS NOT NULL
  AND (p.moeda IS DISTINCT FROM r.moeda);

-- Trigger: herda moeda em datas a partir da expedicao
CREATE OR REPLACE FUNCTION public.tr_herdar_moeda_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_moeda text;
BEGIN
  IF NEW.expedicao_id IS NOT NULL THEN
    SELECT moeda INTO v_moeda FROM public.expedicoes WHERE id = NEW.expedicao_id;
    IF v_moeda IS NOT NULL AND v_moeda <> '' THEN
      NEW.moeda := v_moeda;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_herdar_moeda_data ON public.datas;
CREATE TRIGGER tr_herdar_moeda_data
BEFORE INSERT OR UPDATE OF expedicao_id ON public.datas
FOR EACH ROW EXECUTE FUNCTION public.tr_herdar_moeda_data();

-- Trigger: herda moeda em reservas
CREATE OR REPLACE FUNCTION public.tr_herdar_moeda_reserva()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_moeda text;
BEGIN
  IF NEW.data_id IS NOT NULL THEN
    SELECT moeda INTO v_moeda FROM public.datas WHERE id = NEW.data_id;
  END IF;
  IF (v_moeda IS NULL OR v_moeda = '') AND NEW.expedicao_id IS NOT NULL THEN
    SELECT moeda INTO v_moeda FROM public.expedicoes WHERE id = NEW.expedicao_id;
  END IF;
  IF v_moeda IS NOT NULL AND v_moeda <> '' THEN
    NEW.moeda := v_moeda;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_herdar_moeda_reserva ON public.reservas;
CREATE TRIGGER tr_herdar_moeda_reserva
BEFORE INSERT ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.tr_herdar_moeda_reserva();

-- Remove defaults 'BRL' onde a herança cobre
ALTER TABLE public.datas     ALTER COLUMN moeda DROP DEFAULT;
ALTER TABLE public.reservas  ALTER COLUMN moeda DROP DEFAULT;
ALTER TABLE public.pagamentos ALTER COLUMN moeda DROP DEFAULT;

-- ---------- BLOCO D: Preços corrompidos ----------
UPDATE public.expedicoes SET preco = 3500 WHERE slug = 'rota-dos-tropeiros-da-canastra' AND preco = 3.50;
UPDATE public.expedicoes SET preco = 3600 WHERE slug = 'mantiqueira-4-dias' AND preco = 3.60;

-- Validação via trigger (CHECK não pode usar funções voláteis, mas valor fixo sim;
-- mesmo assim usamos trigger para mensagem clara)
CREATE OR REPLACE FUNCTION public.tr_validar_preco_expedicao()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.preco IS NOT NULL AND NEW.preco > 0 AND NEW.preco < 100 THEN
    RAISE EXCEPTION 'Preço suspeito (%). Valores entre 0 e 100 não são permitidos — possível erro de separador decimal.', NEW.preco;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_validar_preco_expedicao ON public.expedicoes;
CREATE TRIGGER tr_validar_preco_expedicao
BEFORE INSERT OR UPDATE OF preco ON public.expedicoes
FOR EACH ROW EXECUTE FUNCTION public.tr_validar_preco_expedicao();

CREATE OR REPLACE FUNCTION public.tr_validar_preco_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.preco_pix    IS NOT NULL AND NEW.preco_pix    > 0 AND NEW.preco_pix    < 100)
  OR (NEW.preco_cartao IS NOT NULL AND NEW.preco_cartao > 0 AND NEW.preco_cartao < 100) THEN
    RAISE EXCEPTION 'Preço suspeito na data. Valores entre 0 e 100 não são permitidos.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_validar_preco_data ON public.datas;
CREATE TRIGGER tr_validar_preco_data
BEFORE INSERT OR UPDATE OF preco_pix, preco_cartao ON public.datas
FOR EACH ROW EXECUTE FUNCTION public.tr_validar_preco_data();
