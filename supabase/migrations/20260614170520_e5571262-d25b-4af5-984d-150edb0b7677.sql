-- Fase 3 · Bloco 2 — Resolução de cliente por telefone
-- RPC somente leitura. Nunca cria nem altera registros.

CREATE OR REPLACE FUNCTION public._ia_normalizar_telefone(p_tel text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(COALESCE(p_tel,''), '[^0-9]', '', 'g'), '');
$$;

CREATE OR REPLACE FUNCTION public.resolver_lead_por_telefone(p_telefone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_suffix text;
  v_tipo text;
  v_lead_id uuid;
  v_reserva_id uuid;
  v_participante_id uuid;
  v_nome text;
  v_telefone text;
  v_etapa text;
  v_status_op text;
  v_expedicao text;
  v_data_exped text;
  v_moeda text;
  v_total int;
  v_ambiguo boolean := false;
BEGIN
  IF NOT public._ia_pode_atuar() THEN
    RAISE EXCEPTION 'Sem permissão para atuar como IA';
  END IF;

  v_norm := public._ia_normalizar_telefone(p_telefone);
  IF v_norm IS NULL OR length(v_norm) < 8 THEN
    PERFORM public._ia_log('resolver_lead_por_telefone',
      jsonb_build_object('telefone', p_telefone, 'normalizado', v_norm),
      jsonb_build_object('encontrado', false), false, 'Telefone inválido', NULL, NULL);
    RETURN jsonb_build_object('encontrado', false, 'motivo', 'telefone_invalido');
  END IF;

  -- Compara pelos últimos 8+ dígitos para tolerar DDI/DDD/zero a mais
  v_suffix := right(v_norm, 8);

  -- 1) LEADS
  SELECT count(*) INTO v_total
  FROM public.leads
  WHERE public._ia_normalizar_telefone(telefone) LIKE '%' || v_suffix;

  IF v_total > 0 THEN
    v_ambiguo := v_total > 1;
    SELECT l.id, l.nome, l.telefone, l.etapa_atendimento, l.expedicao_interesse
      INTO v_lead_id, v_nome, v_telefone, v_etapa, v_expedicao
    FROM public.leads l
    WHERE public._ia_normalizar_telefone(l.telefone) LIKE '%' || v_suffix
    ORDER BY COALESCE(l.ultima_interacao_at, l.updated_at, l.created_at) DESC
    LIMIT 1;
    v_tipo := 'lead';
  ELSE
    -- 2) RESERVAS
    SELECT count(*) INTO v_total
    FROM public.reservas
    WHERE public._ia_normalizar_telefone(cliente_telefone) LIKE '%' || v_suffix;

    IF v_total > 0 THEN
      v_ambiguo := v_total > 1;
      SELECT r.id, r.lead_id, r.cliente_nome, r.cliente_telefone,
             r.status_operacional, r.expedicao_nome, r.data_label, r.moeda
        INTO v_reserva_id, v_lead_id, v_nome, v_telefone,
             v_status_op, v_expedicao, v_data_exped, v_moeda
      FROM public.reservas r
      WHERE public._ia_normalizar_telefone(r.cliente_telefone) LIKE '%' || v_suffix
      ORDER BY COALESCE(r.updated_at, r.created_at) DESC
      LIMIT 1;
      v_tipo := 'reserva';
    ELSE
      -- 3) PARTICIPANTES
      SELECT count(*) INTO v_total
      FROM public.participantes
      WHERE public._ia_normalizar_telefone(telefone) LIKE '%' || v_suffix;

      IF v_total > 0 THEN
        v_ambiguo := v_total > 1;
        SELECT p.id, p.reserva_id, p.nome, p.telefone
          INTO v_participante_id, v_reserva_id, v_nome, v_telefone
        FROM public.participantes p
        WHERE public._ia_normalizar_telefone(p.telefone) LIKE '%' || v_suffix
        ORDER BY COALESCE(p.updated_at, p.created_at) DESC
        LIMIT 1;
        v_tipo := 'participante';

        IF v_reserva_id IS NOT NULL THEN
          SELECT r.lead_id, r.status_operacional, r.expedicao_nome, r.data_label, r.moeda
            INTO v_lead_id, v_status_op, v_expedicao, v_data_exped, v_moeda
          FROM public.reservas r WHERE r.id = v_reserva_id;
        END IF;
      END IF;
    END IF;
  END IF;

  IF v_tipo IS NULL THEN
    PERFORM public._ia_log('resolver_lead_por_telefone',
      jsonb_build_object('telefone', p_telefone, 'normalizado', v_norm),
      jsonb_build_object('encontrado', false), true, 'nao_encontrado', NULL, NULL);
    RETURN jsonb_build_object('encontrado', false);
  END IF;

  PERFORM public._ia_log('resolver_lead_por_telefone',
    jsonb_build_object('telefone', p_telefone, 'normalizado', v_norm, 'ambiguo', v_ambiguo, 'total', v_total),
    jsonb_build_object('encontrado', true, 'tipo', v_tipo, 'lead_id', v_lead_id, 'reserva_id', v_reserva_id, 'participante_id', v_participante_id),
    true,
    CASE WHEN v_ambiguo THEN 'multiplos_resultados_retornou_mais_recente' ELSE NULL END,
    v_lead_id, v_reserva_id);

  RETURN jsonb_build_object(
    'encontrado', true,
    'tipo', v_tipo,
    'lead_id', v_lead_id,
    'reserva_id', v_reserva_id,
    'participante_id', v_participante_id,
    'nome', v_nome,
    'telefone', v_telefone,
    'etapa', v_etapa,
    'status_operacional', v_status_op,
    'expedicao', v_expedicao,
    'data_expedicao', v_data_exped,
    'moeda', v_moeda,
    'ambiguo', v_ambiguo,
    'total_matches', v_total
  );
END $$;

REVOKE ALL ON FUNCTION public.resolver_lead_por_telefone(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolver_lead_por_telefone(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public._ia_normalizar_telefone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._ia_normalizar_telefone(text) TO authenticated, service_role;