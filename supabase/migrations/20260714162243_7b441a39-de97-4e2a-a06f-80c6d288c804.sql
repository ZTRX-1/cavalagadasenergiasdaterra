
-- Revoke EXECUTE from authenticated on SECURITY DEFINER RPCs; they are called only by edge functions using service_role.
REVOKE EXECUTE ON FUNCTION public.ia_abrir_handoff(text, text, uuid, uuid, jsonb) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ia_anexar_memoria(uuid, text, text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ia_atualizar_temperatura(uuid, text, text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ia_avancar_etapa(uuid, text, text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ia_concluir_tarefa(uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ia_criar_tarefa(text, text, text, uuid, uuid, uuid, integer) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ia_registrar_interacao(uuid, uuid, text, text, text, text, text, integer, integer, integer, numeric, text, text, jsonb, jsonb, uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ia_registrar_objecao(uuid, text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ia_solicitar_alteracao_reserva(uuid, text, text, text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.resolver_lead_por_telefone(text) FROM authenticated, anon;

-- Remove broad SELECT policy on avatars bucket; public URLs still work because the bucket is public=true.
DROP POLICY IF EXISTS "View avatars" ON storage.objects;
