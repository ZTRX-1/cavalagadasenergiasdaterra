-- ─────────────────────────────────────────────────────────────────
-- FASE 3 · BLOCO 1 — Fundação segura da IA Bárbara
-- (sem OpenAI / Evolution / WhatsApp — só DB + RPCs + auditoria)
-- ─────────────────────────────────────────────────────────────────

-- 1) Campos configuráveis em ia_configuracoes (sem hardcode de modelo)
ALTER TABLE public.ia_configuracoes
  ADD COLUMN IF NOT EXISTS modelo_principal     text,
  ADD COLUMN IF NOT EXISTS modelo_fallback      text,
  ADD COLUMN IF NOT EXISTS modelo_classificacao text,
  ADD COLUMN IF NOT EXISTS budget_mensal_usd    numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prompt_versao        text DEFAULT 'v1';

-- 2) Tabela de auditoria de ações da IA
CREATE TABLE IF NOT EXISTS public.ia_acoes_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rpc_nome    text NOT NULL,
  autor       text NOT NULL DEFAULT 'ia',          -- ia | humano | sistema
  ator_id     uuid,                                 -- auth.uid() se humano
  lead_id     uuid,
  reserva_id  uuid,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  resultado   jsonb NOT NULL DEFAULT '{}'::jsonb,
  sucesso     boolean NOT NULL DEFAULT true,
  motivo      text,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ia_acoes_log_autor_chk CHECK (autor IN ('ia','humano','sistema'))
);

GRANT SELECT ON public.ia_acoes_log TO authenticated;
GRANT ALL    ON public.ia_acoes_log TO service_role;

ALTER TABLE public.ia_acoes_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos leem auditoria IA"
  ON public.ia_acoes_log FOR SELECT
  TO authenticated
  USING (public.is_internal_user(auth.uid()));

-- (sem INSERT/UPDATE/DELETE para authenticated → só via SECURITY DEFINER ou service_role)

CREATE INDEX IF NOT EXISTS idx_ia_acoes_log_lead     ON public.ia_acoes_log(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ia_acoes_log_reserva  ON public.ia_acoes_log(reserva_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ia_acoes_log_rpc_dia  ON public.ia_acoes_log(rpc_nome, created_at DESC);

-- 3) Imutabilidade de ia_interacoes (somente INSERT e SELECT)
DROP POLICY IF EXISTS "Internos gerenciam interacoes IA" ON public.ia_interacoes;

CREATE POLICY "Internos leem interacoes IA"
  ON public.ia_interacoes FOR SELECT
  TO authenticated
  USING (public.is_internal_user(auth.uid()));

CREATE POLICY "Internos inserem interacoes IA"
  ON public.ia_interacoes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_internal_user(auth.uid()));

-- (UPDATE/DELETE para authenticated ficam bloqueados — service_role mantém via GRANT)

-- ─────────────────────────────────────────────────────────────────
-- 4) RPCs ia_*
-- Convenção: SECURITY DEFINER, search_path=public, autorizam
-- (usuário interno OU service_role) e gravam auditoria.
-- ─────────────────────────────────────────────────────────────────

-- Helper interno: checa se o caller pode atuar como IA
CREATE OR REPLACE FUNCTION public._ia_pode_atuar()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    current_setting('role', true) = 'service_role'
    OR (auth.uid() IS NOT NULL AND public.is_internal_user(auth.uid()));
$$;

-- Helper interno: registra auditoria
CREATE OR REPLACE FUNCTION public._ia_log(
  p_rpc text, p_payload jsonb, p_resultado jsonb,
  p_sucesso boolean, p_motivo text,
  p_lead uuid, p_reserva uuid
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.ia_acoes_log(rpc_nome, autor, ator_id, lead_id, reserva_id, payload, resultado, sucesso, motivo)
  VALUES (
    p_rpc,
    CASE WHEN auth.uid() IS NULL THEN 'ia' ELSE 'humano' END,
    auth.uid(),
    p_lead, p_reserva,
    COALESCE(p_payload, '{}'::jsonb),
    COALESCE(p_resultado, '{}'::jsonb),
    p_sucesso, p_motivo
  );
$$;

-- ─── ia_atualizar_temperatura ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ia_atualizar_temperatura(
  p_lead_id uuid, p_temperatura text, p_motivo text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_ok boolean := false; v_msg text;
BEGIN
  IF NOT public._ia_pode_atuar() THEN
    RAISE EXCEPTION 'Sem permissão para atuar como IA';
  END IF;
  IF p_temperatura NOT IN ('frio','morno','quente') THEN
    v_msg := 'Temperatura inválida'; 
  ELSIF NOT EXISTS (SELECT 1 FROM public.leads WHERE id = p_lead_id) THEN
    v_msg := 'Lead não encontrado';
  ELSE
    UPDATE public.leads SET temperatura_lead = p_temperatura, updated_at = now() WHERE id = p_lead_id;
    v_ok := true;
  END IF;
  PERFORM public._ia_log('ia_atualizar_temperatura',
    jsonb_build_object('temperatura', p_temperatura, 'motivo', p_motivo),
    jsonb_build_object('ok', v_ok), v_ok, v_msg, p_lead_id, NULL);
  RETURN jsonb_build_object('ok', v_ok, 'motivo', v_msg);
END $$;

-- ─── ia_avancar_etapa ────────────────────────────────────────────
-- Whitelist explícita; etapas terminais (convertido/concluido/perdido) só por humano
CREATE OR REPLACE FUNCTION public.ia_avancar_etapa(
  p_lead_id uuid, p_nova_etapa text, p_motivo text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_ok boolean := false; v_msg text; v_etapas_ia text[] :=
  ARRAY['novo','qualificado','proposta_enviada','reserva_pendente','participante_confirmado'];
BEGIN
  IF NOT public._ia_pode_atuar() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NOT (p_nova_etapa = ANY (v_etapas_ia)) THEN
    v_msg := 'Etapa fora da whitelist da IA (terminais exigem humano)';
  ELSIF NOT EXISTS (SELECT 1 FROM public.leads WHERE id = p_lead_id) THEN
    v_msg := 'Lead não encontrado';
  ELSE
    UPDATE public.leads
       SET etapa_atendimento = p_nova_etapa, updated_at = now()
     WHERE id = p_lead_id;
    v_ok := true;
  END IF;
  PERFORM public._ia_log('ia_avancar_etapa',
    jsonb_build_object('nova_etapa', p_nova_etapa, 'motivo', p_motivo),
    jsonb_build_object('ok', v_ok), v_ok, v_msg, p_lead_id, NULL);
  RETURN jsonb_build_object('ok', v_ok, 'motivo', v_msg);
END $$;

-- ─── ia_registrar_objecao ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ia_registrar_objecao(
  p_lead_id uuid, p_objecao text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_ok boolean := false; v_msg text;
BEGIN
  IF NOT public._ia_pode_atuar() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF coalesce(trim(p_objecao),'') = '' THEN
    v_msg := 'Objeção vazia';
  ELSIF NOT EXISTS (SELECT 1 FROM public.leads WHERE id = p_lead_id) THEN
    v_msg := 'Lead não encontrado';
  ELSE
    INSERT INTO public.lead_conversas(lead_id, tipo_evento, conteudo, metadata)
    VALUES (p_lead_id, 'objecao_ia', p_objecao, jsonb_build_object('origem','ia'));
    v_ok := true;
  END IF;
  PERFORM public._ia_log('ia_registrar_objecao',
    jsonb_build_object('objecao', p_objecao),
    jsonb_build_object('ok', v_ok), v_ok, v_msg, p_lead_id, NULL);
  RETURN jsonb_build_object('ok', v_ok, 'motivo', v_msg);
END $$;

-- ─── ia_anexar_memoria ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ia_anexar_memoria(
  p_lead_id uuid, p_chave text, p_valor text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_ok boolean := false; v_msg text;
BEGIN
  IF NOT public._ia_pode_atuar() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF coalesce(trim(p_chave),'') = '' THEN
    v_msg := 'Chave vazia';
  ELSIF NOT EXISTS (SELECT 1 FROM public.leads WHERE id = p_lead_id) THEN
    v_msg := 'Lead não encontrado';
  ELSE
    INSERT INTO public.lead_memoria(lead_id, dados_extraidos, ultima_atualizacao)
    VALUES (p_lead_id, jsonb_build_object(p_chave, p_valor), now())
    ON CONFLICT (lead_id) DO UPDATE
      SET dados_extraidos = public.lead_memoria.dados_extraidos || jsonb_build_object(p_chave, p_valor),
          ultima_atualizacao = now();
    v_ok := true;
  END IF;
  PERFORM public._ia_log('ia_anexar_memoria',
    jsonb_build_object('chave', p_chave, 'valor', p_valor),
    jsonb_build_object('ok', v_ok), v_ok, v_msg, p_lead_id, NULL);
  RETURN jsonb_build_object('ok', v_ok, 'motivo', v_msg);
END $$;

-- ─── ia_criar_tarefa ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ia_criar_tarefa(
  p_titulo text, p_descricao text DEFAULT NULL,
  p_prioridade text DEFAULT 'media',
  p_lead_id uuid DEFAULT NULL, p_reserva_id uuid DEFAULT NULL,
  p_participante_id uuid DEFAULT NULL,
  p_prazo_horas int DEFAULT 24
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid; v_msg text;
BEGIN
  IF NOT public._ia_pode_atuar() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF coalesce(trim(p_titulo),'') = '' THEN
    v_msg := 'Título vazio';
    PERFORM public._ia_log('ia_criar_tarefa',
      jsonb_build_object('titulo', p_titulo), '{}'::jsonb, false, v_msg, p_lead_id, p_reserva_id);
    RETURN jsonb_build_object('ok', false, 'motivo', v_msg);
  END IF;
  v_id := public.criar_tarefa_idempotente(
    p_titulo, 'geral', 'ia', p_prioridade,
    p_lead_id, p_reserva_id, p_participante_id,
    make_interval(hours => GREATEST(1, p_prazo_horas))
  );
  IF p_descricao IS NOT NULL THEN
    UPDATE public.tarefas SET descricao = p_descricao WHERE id = v_id;
  END IF;
  PERFORM public._ia_log('ia_criar_tarefa',
    jsonb_build_object('titulo', p_titulo, 'prioridade', p_prioridade, 'prazo_horas', p_prazo_horas),
    jsonb_build_object('tarefa_id', v_id), true, NULL, p_lead_id, p_reserva_id);
  RETURN jsonb_build_object('ok', true, 'tarefa_id', v_id);
END $$;

-- ─── ia_concluir_tarefa ──────────────────────────────────────────
-- Só permite concluir tarefas com origem='ia'
CREATE OR REPLACE FUNCTION public.ia_concluir_tarefa(p_tarefa_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_origem text; v_ok boolean := false; v_msg text;
        v_lead uuid; v_reserva uuid;
BEGIN
  IF NOT public._ia_pode_atuar() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT origem, lead_id, reserva_id INTO v_origem, v_lead, v_reserva
  FROM public.tarefas WHERE id = p_tarefa_id;
  IF NOT FOUND THEN
    v_msg := 'Tarefa não encontrada';
  ELSIF v_origem <> 'ia' THEN
    v_msg := 'IA só pode concluir tarefas de origem ia';
  ELSE
    UPDATE public.tarefas
       SET status='concluida', concluida_em=now(), updated_at=now()
     WHERE id = p_tarefa_id;
    v_ok := true;
  END IF;
  PERFORM public._ia_log('ia_concluir_tarefa',
    jsonb_build_object('tarefa_id', p_tarefa_id),
    jsonb_build_object('ok', v_ok), v_ok, v_msg, v_lead, v_reserva);
  RETURN jsonb_build_object('ok', v_ok, 'motivo', v_msg);
END $$;

-- ─── ia_abrir_handoff ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ia_abrir_handoff(
  p_motivo text, p_prioridade text DEFAULT 'media',
  p_lead_id uuid DEFAULT NULL, p_reserva_id uuid DEFAULT NULL,
  p_contexto jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid; v_msg text;
BEGIN
  IF NOT public._ia_pode_atuar() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF coalesce(trim(p_motivo),'') = '' THEN
    v_msg := 'Motivo obrigatório';
    PERFORM public._ia_log('ia_abrir_handoff', jsonb_build_object('motivo',p_motivo),
      '{}'::jsonb, false, v_msg, p_lead_id, p_reserva_id);
    RETURN jsonb_build_object('ok', false, 'motivo', v_msg);
  END IF;
  INSERT INTO public.ia_handoff_queue(motivo, prioridade, origem, lead_id, reserva_id, notas, status)
  VALUES (p_motivo, p_prioridade, 'ia', p_lead_id, p_reserva_id, p_contexto::text, 'pendente')
  RETURNING id INTO v_id;
  PERFORM public._ia_log('ia_abrir_handoff',
    jsonb_build_object('motivo', p_motivo, 'prioridade', p_prioridade, 'contexto', p_contexto),
    jsonb_build_object('handoff_id', v_id), true, NULL, p_lead_id, p_reserva_id);
  RETURN jsonb_build_object('ok', true, 'handoff_id', v_id);
END $$;

-- ─── ia_solicitar_alteracao_reserva ──────────────────────────────
-- Whitelist segura aplica direto. Blacklist explícita rejeita. Demais → handoff alta.
CREATE OR REPLACE FUNCTION public.ia_solicitar_alteracao_reserva(
  p_reserva_id uuid, p_campo text, p_novo_valor text, p_motivo text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_lead uuid; v_msg text; v_handoff uuid;
  v_whitelist text[] := ARRAY['observacoes_internas','motivacao_viagem','observacoes_importantes','tipo_grupo'];
  v_blacklist text[] := ARRAY[
    'valor_total','valor_pago','valor_entrada','saldo_restante',
    'status','status_financeiro','status_operacional','status_pagamento','status_documentacao',
    'data_id','expedicao_id','quantidade_participantes','protocolo'
  ];
  v_aplicado boolean := false;
BEGIN
  IF NOT public._ia_pode_atuar() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT lead_id INTO v_lead FROM public.reservas WHERE id = p_reserva_id;
  IF v_lead IS NULL AND NOT FOUND THEN
    v_msg := 'Reserva não encontrada';
    PERFORM public._ia_log('ia_solicitar_alteracao_reserva',
      jsonb_build_object('campo',p_campo,'novo_valor',p_novo_valor),
      '{}'::jsonb, false, v_msg, NULL, p_reserva_id);
    RETURN jsonb_build_object('ok', false, 'motivo', v_msg);
  END IF;

  IF p_campo = ANY (v_blacklist) THEN
    v_msg := 'Campo proibido para a IA — exige humano';
    PERFORM public._ia_log('ia_solicitar_alteracao_reserva',
      jsonb_build_object('campo',p_campo,'novo_valor',p_novo_valor,'motivo',p_motivo),
      '{}'::jsonb, false, v_msg, v_lead, p_reserva_id);
    RETURN jsonb_build_object('ok', false, 'motivo', v_msg, 'bloqueado', true);
  END IF;

  IF p_campo = ANY (v_whitelist) THEN
    EXECUTE format('UPDATE public.reservas SET %I = $1, updated_at = now() WHERE id = $2', p_campo)
      USING p_novo_valor, p_reserva_id;
    v_aplicado := true;
    PERFORM public._ia_log('ia_solicitar_alteracao_reserva',
      jsonb_build_object('campo',p_campo,'novo_valor',p_novo_valor,'motivo',p_motivo,'aplicado',true),
      '{}'::jsonb, true, NULL, v_lead, p_reserva_id);
    RETURN jsonb_build_object('ok', true, 'aplicado', true);
  END IF;

  -- Campo fora da whitelist e fora da blacklist → handoff alta
  INSERT INTO public.ia_handoff_queue(motivo, prioridade, origem, lead_id, reserva_id, notas, status)
  VALUES (
    'Alteração de reserva solicitada pela IA: ' || p_campo,
    'alta', 'ia', v_lead, p_reserva_id,
    jsonb_build_object('campo',p_campo,'novo_valor',p_novo_valor,'motivo',p_motivo)::text,
    'pendente'
  ) RETURNING id INTO v_handoff;

  PERFORM public._ia_log('ia_solicitar_alteracao_reserva',
    jsonb_build_object('campo',p_campo,'novo_valor',p_novo_valor,'motivo',p_motivo,'handoff_id',v_handoff),
    jsonb_build_object('handoff_id',v_handoff), true, 'campo fora da whitelist — encaminhado para humano', v_lead, p_reserva_id);

  RETURN jsonb_build_object('ok', true, 'aplicado', false, 'handoff_id', v_handoff);
END $$;

-- ─── ia_registrar_interacao ──────────────────────────────────────
-- Grava a proposta/resposta da LLM em ia_interacoes (tabela imutável).
CREATE OR REPLACE FUNCTION public.ia_registrar_interacao(
  p_lead_id uuid, p_reserva_id uuid DEFAULT NULL,
  p_canal text DEFAULT 'whatsapp', p_direcao text DEFAULT 'out',
  p_conteudo text DEFAULT NULL, p_resposta_final text DEFAULT NULL,
  p_modelo text DEFAULT NULL,
  p_tokens_in int DEFAULT NULL, p_tokens_out int DEFAULT NULL,
  p_latencia_ms int DEFAULT NULL,
  p_confidence numeric DEFAULT NULL,
  p_intent text DEFAULT NULL,
  p_motivo_handoff text DEFAULT NULL,
  p_contexto_usado jsonb DEFAULT '{}'::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_mensagem_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public._ia_pode_atuar() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  INSERT INTO public.ia_interacoes(
    lead_id, reserva_id, canal, direcao, autor, conteudo, resposta_final,
    modelo, tokens_in, tokens_out, latencia_ms, confidence, intent,
    motivo_handoff, contexto_usado, metadata, mensagem_id
  ) VALUES (
    p_lead_id, p_reserva_id, p_canal, p_direcao, 'ia', p_conteudo, p_resposta_final,
    p_modelo, p_tokens_in, p_tokens_out, p_latencia_ms, p_confidence, p_intent,
    p_motivo_handoff, COALESCE(p_contexto_usado,'{}'::jsonb), COALESCE(p_metadata,'{}'::jsonb), p_mensagem_id
  ) RETURNING id INTO v_id;
  PERFORM public._ia_log('ia_registrar_interacao',
    jsonb_build_object('modelo',p_modelo,'confidence',p_confidence,'intent',p_intent,'tokens_in',p_tokens_in,'tokens_out',p_tokens_out),
    jsonb_build_object('interacao_id',v_id), true, NULL, p_lead_id, p_reserva_id);
  RETURN jsonb_build_object('ok', true, 'interacao_id', v_id);
END $$;

-- ─── GRANTS de execução das RPCs ─────────────────────────────────
GRANT EXECUTE ON FUNCTION public.ia_atualizar_temperatura(uuid,text,text)        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_avancar_etapa(uuid,text,text)                 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_registrar_objecao(uuid,text)                  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_anexar_memoria(uuid,text,text)                TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_criar_tarefa(text,text,text,uuid,uuid,uuid,int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_concluir_tarefa(uuid)                         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_abrir_handoff(text,text,uuid,uuid,jsonb)       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_solicitar_alteracao_reserva(uuid,text,text,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_registrar_interacao(uuid,uuid,text,text,text,text,text,int,int,int,numeric,text,text,jsonb,jsonb,uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public._ia_pode_atuar() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._ia_log(text,jsonb,jsonb,boolean,text,uuid,uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public._ia_pode_atuar()                                 TO service_role;
GRANT  EXECUTE ON FUNCTION public._ia_log(text,jsonb,jsonb,boolean,text,uuid,uuid) TO service_role;

-- 5) View de auditoria diária (consumida pelo painel)
CREATE OR REPLACE VIEW public.vw_ia_auditoria_diaria AS
SELECT
  date_trunc('day', created_at)::date AS dia,
  rpc_nome,
  count(*)                            AS total,
  count(*) FILTER (WHERE sucesso)     AS sucessos,
  count(*) FILTER (WHERE NOT sucesso) AS falhas
FROM public.ia_acoes_log
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

GRANT SELECT ON public.vw_ia_auditoria_diaria TO authenticated, service_role;