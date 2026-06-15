
-- =====================================================
-- ETAPA 2: BACKUP COMPLETO
-- =====================================================
CREATE SCHEMA IF NOT EXISTS backup_limpeza_pre_operacao_20260615;
GRANT USAGE ON SCHEMA backup_limpeza_pre_operacao_20260615 TO service_role;

DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'leads','reservas','participantes','pagamentos',
    'mensagens_canal','ia_interacoes','ia_decisoes','ia_handoff_queue',
    'tarefas','lead_conversas','reserva_historico','webhooks_eventos',
    'contexto_acessos','ia_acoes_log','ia_contexto_logs',
    'lead_memoria','lead_atividades','reserva_documentos','documentos_central'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format(
      'CREATE TABLE backup_limpeza_pre_operacao_20260615.%I AS TABLE public.%I',
      t, t
    );
  END LOOP;
END $$;

-- =====================================================
-- ETAPA 3: LIMPEZA TOTAL (ordem respeitando FKs)
-- Triggers podem inserir em webhooks_eventos/historico/etc.
-- Desativamos session_replication_role para evitar cascata indesejada.
-- =====================================================
SET session_replication_role = replica;

TRUNCATE TABLE
  public.ia_acoes_log,
  public.ia_contexto_logs,
  public.ia_interacoes,
  public.ia_decisoes,
  public.ia_handoff_queue,
  public.contexto_acessos,
  public.webhooks_eventos,
  public.reserva_historico,
  public.lead_conversas,
  public.lead_atividades,
  public.lead_memoria,
  public.tarefas,
  public.mensagens_canal,
  public.reserva_documentos,
  public.pagamentos,
  public.participantes,
  public.reservas,
  public.leads,
  public.notificacoes_lidas
RESTART IDENTITY CASCADE;

-- Documentos: remover apenas vinculados a leads/reservas (modelos têm lead_id/reserva_id/expedicao_id NULL)
DELETE FROM public.documentos_central
WHERE lead_id IS NOT NULL OR reserva_id IS NOT NULL;

SET session_replication_role = DEFAULT;

-- Reset contadores de protocolo
UPDATE public.protocolo_counter SET valor = 0;
UPDATE public.protocolo_lead_counter SET valor = 0;

-- Recalcular vagas de todas as datas (agora todas livres)
DO $$
DECLARE d uuid;
BEGIN
  FOR d IN SELECT id FROM public.datas LOOP
    PERFORM public.recalcular_vagas_data(d);
  END LOOP;
END $$;
