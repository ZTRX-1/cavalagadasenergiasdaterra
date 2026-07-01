
-- =============================================================
-- Revoga EXECUTE de funções internas / de trigger para anon e authenticated
-- =============================================================
DO $$
DECLARE
  fn text;
  trigger_fns text[] := ARRAY[
    'tr_gerar_protocolo_lead()',
    'tr_handoff_atualizar()',
    'tr_herdar_moeda_data()',
    'tr_herdar_moeda_pagamento()',
    'tr_herdar_moeda_reserva()',
    'tr_ia_kb_atualizacao()',
    'tr_msg_bump_lead_interacao()',
    'tr_pagamento_tarefa_auto()',
    'tr_participante_tarefa_auto()',
    'tr_reserva_tarefas_auto()',
    'prevent_profile_role_self_update()',
    'documento_central_evento()',
    'fn_master_sync_participantes()',
    'handle_new_internal_user()',
    'handle_new_user()',
    'lead_conversa_inserida()',
    'lead_etapa_changed()',
    'lead_force_etapa_novo()',
    'protect_cargo_developer()',
    'protect_desenvolvedor_role()',
    'reserva_status_changed()',
    'trg_log_reserva_changes()',
    'trg_recalcular_vagas()',
    'trg_validar_participante_idade()',
    'tr_validar_preco_data()',
    'tr_validar_preco_expedicao()',
    'sanitizar_origem_lead()',
    'log_conversao_lead()',
    'sync_reserva_to_lead_summary()',
    'gerar_resumo_ia_lead()',
    'update_updated_at_column()'
  ];
  internal_fns text[] := ARRAY[
    '_ia_log(text, jsonb, jsonb, boolean, text, uuid, uuid)',
    '_ia_pode_atuar()',
    '_ia_normalizar_telefone(text)',
    'alertar_ia_atendimento_atrasado()',
    'processar_pos_expedicao()',
    'scan_parcelas_vencimento()',
    'recalcular_vagas_data(uuid)',
    'reconstruir_resumo_ia_reserva(uuid)',
    'slugify_unique_expedicao(text)',
    'criar_tarefa_idempotente(text, text, text, text, uuid, uuid, uuid, interval)',
    'gerar_protocolo()',
    'gerar_protocolo_lead()'
  ];
BEGIN
  FOREACH fn IN ARRAY trigger_fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN NULL;
    END;
  END LOOP;

  FOREACH fn IN ARRAY internal_fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN NULL;
    END;
  END LOOP;
END $$;

-- =============================================================
-- Revoga acesso de anon a RPCs de IA / resolvers (devem exigir login interno)
-- =============================================================
DO $$
DECLARE
  fn text;
  ia_rpcs text[] := ARRAY[
    'ia_abrir_handoff(text, text, uuid, uuid, jsonb)',
    'ia_anexar_memoria(uuid, text, text)',
    'ia_atualizar_temperatura(uuid, text, text)',
    'ia_avancar_etapa(uuid, text, text)',
    'ia_concluir_tarefa(uuid)',
    'ia_criar_tarefa(text, text, text, uuid, uuid, uuid, integer)',
    'ia_registrar_interacao(uuid, uuid, text, text, text, text, text, integer, integer, integer, numeric, text, text, jsonb, jsonb, uuid)',
    'ia_registrar_objecao(uuid, text)',
    'ia_solicitar_alteracao_reserva(uuid, text, text, text)',
    'resolver_lead_por_telefone(text)',
    'check_crm_health()',
    'has_role(uuid, app_role)',
    'is_internal_user(uuid)',
    'get_primary_role(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY ia_rpcs LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXCEPTION WHEN undefined_function THEN NULL;
    END;
  END LOOP;
END $$;
