DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'ia_atualizar_temperatura','ia_avancar_etapa','ia_registrar_objecao',
        'ia_anexar_memoria','ia_criar_tarefa','ia_concluir_tarefa',
        'ia_abrir_handoff','ia_solicitar_alteracao_reserva','ia_registrar_interacao',
        '_ia_pode_atuar','_ia_log'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon',   r.sig);
  END LOOP;
END $$;

-- Re-conceder explicitamente apenas para os papéis desejados
GRANT EXECUTE ON FUNCTION public.ia_atualizar_temperatura(uuid,text,text)              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_avancar_etapa(uuid,text,text)                       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_registrar_objecao(uuid,text)                        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_anexar_memoria(uuid,text,text)                      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_criar_tarefa(text,text,text,uuid,uuid,uuid,int)     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_concluir_tarefa(uuid)                               TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_abrir_handoff(text,text,uuid,uuid,jsonb)             TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_solicitar_alteracao_reserva(uuid,text,text,text)     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ia_registrar_interacao(uuid,uuid,text,text,text,text,text,int,int,int,numeric,text,text,jsonb,jsonb,uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._ia_pode_atuar()                                       TO service_role;
GRANT EXECUTE ON FUNCTION public._ia_log(text,jsonb,jsonb,boolean,text,uuid,uuid)        TO service_role;

-- View também usar SECURITY INVOKER (Postgres 15+) para evitar lint 0010
ALTER VIEW public.vw_ia_auditoria_diaria SET (security_invoker = on);