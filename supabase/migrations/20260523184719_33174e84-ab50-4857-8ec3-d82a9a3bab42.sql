-- Remover policy permissiva — reservas serão criadas via server function (admin)
DROP POLICY IF EXISTS "Qualquer um pode criar reserva" ON public.reservas;

-- Remover default que exigia execução pública da função
ALTER TABLE public.reservas ALTER COLUMN protocolo DROP DEFAULT;

-- Restringir execução da função geradora de protocolo
REVOKE EXECUTE ON FUNCTION public.gerar_protocolo() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.gerar_protocolo() FROM anon;
REVOKE EXECUTE ON FUNCTION public.gerar_protocolo() FROM authenticated;
