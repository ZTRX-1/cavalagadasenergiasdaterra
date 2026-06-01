
CREATE TABLE public.notificacoes_lidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  webhook_evento_id uuid NOT NULL REFERENCES public.webhooks_eventos(id) ON DELETE CASCADE,
  lida_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, webhook_evento_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes_lidas TO authenticated;
GRANT ALL ON public.notificacoes_lidas TO service_role;

ALTER TABLE public.notificacoes_lidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia suas próprias leituras"
ON public.notificacoes_lidas
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_notificacoes_lidas_user ON public.notificacoes_lidas(user_id);
CREATE INDEX idx_notificacoes_lidas_evento ON public.notificacoes_lidas(webhook_evento_id);

-- Permitir leitura de eventos por usuários internos para alimentar a central de notificações
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='webhooks_eventos'
    AND policyname='Usuários internos podem visualizar eventos'
  ) THEN
    EXECUTE 'CREATE POLICY "Usuários internos podem visualizar eventos" ON public.webhooks_eventos FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()))';
  END IF;
END $$;

GRANT SELECT ON public.webhooks_eventos TO authenticated;
