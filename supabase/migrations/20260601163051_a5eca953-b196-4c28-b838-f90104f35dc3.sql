
-- Atualiza ordenação de papéis
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role::text FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role::text
    WHEN 'desenvolvedor' THEN 0
    WHEN 'superadmin'    THEN 1
    WHEN 'admin'         THEN 2
    WHEN 'ceo'           THEN 3
    WHEN 'ceo_preview'   THEN 4
    WHEN 'socia'         THEN 5
    WHEN 'operador'      THEN 6
    ELSE 99
  END
  LIMIT 1
$function$;

-- Proteção: somente desenvolvedor pode remover/alterar role 'desenvolvedor'
CREATE OR REPLACE FUNCTION public.protect_desenvolvedor_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role::text = 'desenvolvedor')
     OR (TG_OP = 'UPDATE' AND OLD.role::text = 'desenvolvedor' AND NEW.role::text <> 'desenvolvedor') THEN
    IF NOT public.has_role(auth.uid(), 'desenvolvedor'::app_role) THEN
      RAISE EXCEPTION 'Apenas um Desenvolvedor pode remover outro Desenvolvedor';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_desenvolvedor ON public.user_roles;
CREATE TRIGGER trg_protect_desenvolvedor
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.protect_desenvolvedor_role();

-- IA configurações
CREATE TABLE IF NOT EXISTS public.ia_configuracoes (
  id boolean PRIMARY KEY DEFAULT true,
  singleton boolean NOT NULL DEFAULT true,
  horario_inicio text DEFAULT '08:00',
  horario_fim text DEFAULT '20:00',
  dias_atendimento text[] NOT NULL DEFAULT ARRAY['seg','ter','qua','qui','sex','sab'],
  mensagem_fora_horario text DEFAULT 'Olá! Nosso atendimento humano está fora do horário. Retornaremos em breve.',
  whatsapp_comercial text,
  whatsapp_financeiro text,
  perguntas_qualificacao jsonb NOT NULL DEFAULT '[]'::jsonb,
  regras_encaminhamento jsonb NOT NULL DEFAULT '[]'::jsonb,
  tom_ia text DEFAULT 'acolhedor',
  ativa boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ia_configuracoes_singleton CHECK (id = true)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_configuracoes TO authenticated;
GRANT ALL ON public.ia_configuracoes TO service_role;

ALTER TABLE public.ia_configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos leem ia_configuracoes"
  ON public.ia_configuracoes FOR SELECT TO authenticated
  USING (public.is_internal_user(auth.uid()));

CREATE POLICY "Admins gerenciam ia_configuracoes"
  ON public.ia_configuracoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role) OR public.has_role(auth.uid(), 'desenvolvedor'::app_role) OR public.has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role) OR public.has_role(auth.uid(), 'desenvolvedor'::app_role) OR public.has_role(auth.uid(), 'ceo'::app_role));

INSERT INTO public.ia_configuracoes (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Integrações
CREATE TABLE IF NOT EXISTS public.integracoes_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  categoria text NOT NULL DEFAULT 'automacao',
  status text NOT NULL DEFAULT 'nao_configurado',
  configuracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultimo_evento_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integracoes_status TO authenticated;
GRANT ALL ON public.integracoes_status TO service_role;

ALTER TABLE public.integracoes_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos leem integracoes_status"
  ON public.integracoes_status FOR SELECT TO authenticated
  USING (public.is_internal_user(auth.uid()));

CREATE POLICY "Admins gerenciam integracoes_status"
  ON public.integracoes_status FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role) OR public.has_role(auth.uid(), 'desenvolvedor'::app_role) OR public.has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role) OR public.has_role(auth.uid(), 'desenvolvedor'::app_role) OR public.has_role(auth.uid(), 'ceo'::app_role));

INSERT INTO public.integracoes_status (chave, nome, descricao, categoria) VALUES
  ('whatsapp', 'WhatsApp', 'Atendimento comercial e financeiro via WhatsApp', 'mensageria'),
  ('openai', 'OpenAI', 'IA generativa para qualificação e respostas', 'ia'),
  ('n8n', 'n8n', 'Orquestrador de automações e workflows', 'automacao'),
  ('email', 'E-mail', 'Envio transacional e notificações por e-mail', 'mensageria')
ON CONFLICT (chave) DO NOTHING;
