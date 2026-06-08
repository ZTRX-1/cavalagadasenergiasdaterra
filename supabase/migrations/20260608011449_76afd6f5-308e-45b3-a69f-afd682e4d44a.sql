-- Revoke from PUBLIC, anon, and authenticated to be sure
DO $$ 
DECLARE 
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prosecdef = true
        AND p.proname NOT IN ('get_primary_role', 'has_role', 'is_internal_user')
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', 
                       func_record.proname, func_record.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', 
                       func_record.proname, func_record.args);
    END LOOP;
END $$;

-- Specifically manage the ones we want authenticated users to have
REVOKE ALL ON FUNCTION public.get_primary_role(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_internal_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_internal_user(uuid) TO authenticated, service_role;
