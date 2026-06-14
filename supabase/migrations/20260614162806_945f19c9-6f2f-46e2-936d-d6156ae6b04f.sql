
-- 1) mensagens_canal — consolida canal + direcao
ALTER TABLE public.mensagens_canal DROP CONSTRAINT IF EXISTS mensagens_canal_canal_check;
ALTER TABLE public.mensagens_canal DROP CONSTRAINT IF EXISTS mensagens_canal_canal_chk;
ALTER TABLE public.mensagens_canal
  ADD CONSTRAINT mensagens_canal_canal_check
  CHECK (canal IN ('whatsapp','instagram','site','email','sms','telefone','manual','outro'));

ALTER TABLE public.mensagens_canal DROP CONSTRAINT IF EXISTS mensagens_canal_direcao_check;
ALTER TABLE public.mensagens_canal DROP CONSTRAINT IF EXISTS mensagens_canal_direcao_chk;
ALTER TABLE public.mensagens_canal
  ADD CONSTRAINT mensagens_canal_direcao_check CHECK (direcao IN ('in','out'));

-- 2) ia_handoff_queue — consolida status + prioridade
ALTER TABLE public.ia_handoff_queue DROP CONSTRAINT IF EXISTS ia_handoff_queue_status_check;
ALTER TABLE public.ia_handoff_queue DROP CONSTRAINT IF EXISTS ia_handoff_status_chk;
ALTER TABLE public.ia_handoff_queue
  ADD CONSTRAINT ia_handoff_queue_status_check
  CHECK (status IN ('pendente','em_andamento','resolvido','cancelado'));

ALTER TABLE public.ia_handoff_queue DROP CONSTRAINT IF EXISTS ia_handoff_queue_prioridade_check;
ALTER TABLE public.ia_handoff_queue DROP CONSTRAINT IF EXISTS ia_handoff_prioridade_chk;
ALTER TABLE public.ia_handoff_queue
  ADD CONSTRAINT ia_handoff_queue_prioridade_check
  CHECK (prioridade IN ('baixa','media','alta','critica'));

-- 3) ia_interacoes — garante direcao único (in/out)
ALTER TABLE public.ia_interacoes DROP CONSTRAINT IF EXISTS ia_interacoes_direcao_check;
ALTER TABLE public.ia_interacoes DROP CONSTRAINT IF EXISTS ia_interacoes_direcao_chk;
ALTER TABLE public.ia_interacoes
  ADD CONSTRAINT ia_interacoes_direcao_check CHECK (direcao IN ('in','out'));

-- 4) Atualiza ultima_interacao_at do lead sempre que entra/sai mensagem
CREATE OR REPLACE FUNCTION public.tr_msg_bump_lead_interacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads
       SET ultima_interacao_at = GREATEST(COALESCE(ultima_interacao_at, NEW.created_at), NEW.created_at)
     WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_msg_bump_lead ON public.mensagens_canal;
CREATE TRIGGER trg_msg_bump_lead
AFTER INSERT ON public.mensagens_canal
FOR EACH ROW EXECUTE FUNCTION public.tr_msg_bump_lead_interacao();

-- 5) Tabela de auditoria S2S do contexto-360
CREATE TABLE IF NOT EXISTS public.contexto_acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem text NOT NULL,                  -- 'usuario' | 's2s'
  cliente text,                          -- nome do serviço (ex: 'n8n', 'evolution', 'barbara')
  tipo text NOT NULL,                    -- 'lead' | 'reserva'
  alvo_id uuid NOT NULL,
  user_id uuid,
  ip text,
  status int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.contexto_acessos TO authenticated;
GRANT ALL ON public.contexto_acessos TO service_role;
ALTER TABLE public.contexto_acessos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contexto_acessos visiveis para internos"
  ON public.contexto_acessos FOR SELECT TO authenticated
  USING (public.is_internal_user(auth.uid()));
CREATE POLICY "contexto_acessos insert interno"
  ON public.contexto_acessos FOR INSERT TO authenticated
  WITH CHECK (public.is_internal_user(auth.uid()));
