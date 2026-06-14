CREATE TABLE public.ia_decisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NULL,
  reserva_id uuid NULL,
  telefone_hash text NULL,
  mensagem_entrada text NOT NULL,
  contexto_utilizado jsonb NOT NULL DEFAULT '{}'::jsonb,
  resposta_sugerida text NULL,
  intent text NULL,
  confidence numeric(4,3) NULL,
  acao_sugerida text NULL,
  handoff_recomendado boolean NOT NULL DEFAULT false,
  motivo_handoff text NULL,
  tokens_estimados integer NULL,
  modelo text NULL,
  prompt_versao text NULL,
  shadow boolean NOT NULL DEFAULT true,
  tempo_execucao_ms integer NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ia_decisoes TO authenticated;
GRANT ALL ON public.ia_decisoes TO service_role;

ALTER TABLE public.ia_decisoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ia_decisoes_select_internal"
ON public.ia_decisoes
FOR SELECT
TO authenticated
USING (public.is_internal_user(auth.uid()));

CREATE INDEX ia_decisoes_created_at_idx ON public.ia_decisoes (created_at DESC);
CREATE INDEX ia_decisoes_lead_idx ON public.ia_decisoes (lead_id);
CREATE INDEX ia_decisoes_intent_idx ON public.ia_decisoes (intent);