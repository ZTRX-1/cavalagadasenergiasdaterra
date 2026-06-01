
-- Bucket privado para a central de documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('central-docs', 'central-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Tabela principal da Central de Documentos
CREATE TABLE public.documentos_central (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria text NOT NULL DEFAULT 'documento_interno',
  titulo text NOT NULL,
  descricao text,
  arquivo_url text,
  arquivo_nome text,
  arquivo_mime text,
  arquivo_tamanho bigint,

  -- Vínculos opcionais
  lead_id uuid,
  reserva_id uuid,
  cliente_nome text,
  cliente_email text,
  expedicao_id uuid,
  participante_id uuid,

  -- Notas fiscais (campos opcionais)
  nf_numero text,
  nf_cnpj text,
  nf_empresa text,
  nf_data date,
  nf_valor numeric,

  -- Status & observações
  status text NOT NULL DEFAULT 'recebido',
  observacoes_internas text,

  -- Preparação para IA
  texto_extraido text,
  dados_extraidos jsonb NOT NULL DEFAULT '{}'::jsonb,
  status_processamento text NOT NULL DEFAULT 'pendente',

  -- Auditoria
  enviado_por uuid,
  enviado_por_nome text,
  aprovado_por uuid,
  aprovado_em timestamptz,

  tags text[] NOT NULL DEFAULT ARRAY[]::text[],

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT documentos_central_categoria_check CHECK (categoria IN (
    'nota_fiscal','contrato','comprovante','termo','documento_participante','documento_interno','outro'
  )),
  CONSTRAINT documentos_central_status_check CHECK (status IN (
    'recebido','enviado','aprovado','rejeitado','arquivado'
  )),
  CONSTRAINT documentos_central_proc_check CHECK (status_processamento IN (
    'pendente','processando','concluido','erro'
  ))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos_central TO authenticated;
GRANT ALL ON public.documentos_central TO service_role;

ALTER TABLE public.documentos_central ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam documentos_central"
  ON public.documentos_central FOR ALL
  TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

CREATE INDEX idx_doccent_categoria ON public.documentos_central(categoria);
CREATE INDEX idx_doccent_expedicao ON public.documentos_central(expedicao_id);
CREATE INDEX idx_doccent_reserva ON public.documentos_central(reserva_id);
CREATE INDEX idx_doccent_lead ON public.documentos_central(lead_id);
CREATE INDEX idx_doccent_created ON public.documentos_central(created_at DESC);

-- Trigger updated_at
CREATE TRIGGER trg_doccent_updated_at
  BEFORE UPDATE ON public.documentos_central
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de eventos para automações futuras
CREATE OR REPLACE FUNCTION public.documento_central_evento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('documento_recebido', 'documento_central', NEW.id,
      jsonb_build_object('categoria', NEW.categoria, 'titulo', NEW.titulo,
        'reserva_id', NEW.reserva_id, 'lead_id', NEW.lead_id, 'expedicao_id', NEW.expedicao_id));
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'enviado' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('documento_enviado', 'documento_central', NEW.id,
        jsonb_build_object('categoria', NEW.categoria, 'titulo', NEW.titulo));
    ELSIF NEW.status = 'aprovado' THEN
      NEW.aprovado_em := COALESCE(NEW.aprovado_em, now());
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('documento_aprovado', 'documento_central', NEW.id,
        jsonb_build_object('categoria', NEW.categoria, 'titulo', NEW.titulo));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_doccent_evento
  BEFORE INSERT OR UPDATE ON public.documentos_central
  FOR EACH ROW EXECUTE FUNCTION public.documento_central_evento();

-- Política de storage para o bucket
CREATE POLICY "Internos leem central-docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'central-docs' AND is_internal_user(auth.uid()));

CREATE POLICY "Internos inserem central-docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'central-docs' AND is_internal_user(auth.uid()));

CREATE POLICY "Internos atualizam central-docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'central-docs' AND is_internal_user(auth.uid()));

CREATE POLICY "Internos deletam central-docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'central-docs' AND is_internal_user(auth.uid()));
