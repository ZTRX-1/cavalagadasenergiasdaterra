
-- ============ ANALYTICS ============
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  user_agent text,
  country text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views(path);
CREATE INDEX idx_page_views_session ON public.page_views(session_id);

GRANT INSERT ON public.page_views TO anon;
GRANT INSERT, SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um insere page_views"
  ON public.page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Internos leem page_views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (is_internal_user(auth.uid()));

-- ============ DESPESAS ============
CREATE TABLE public.despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL DEFAULT CURRENT_DATE,
  categoria text NOT NULL,
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  expedicao_id uuid,
  anexo_url text,
  status text NOT NULL DEFAULT 'pago',
  fornecedor text,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_despesas_data ON public.despesas(data DESC);
CREATE INDEX idx_despesas_expedicao ON public.despesas(expedicao_id);
CREATE INDEX idx_despesas_categoria ON public.despesas(categoria);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas TO authenticated;
GRANT ALL ON public.despesas TO service_role;

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam despesas"
  ON public.despesas FOR ALL
  TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

CREATE TRIGGER update_despesas_updated_at
  BEFORE UPDATE ON public.despesas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONTAS A PAGAR ============
CREATE TABLE public.contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  categoria text,
  fornecedor text,
  expedicao_id uuid,
  pago_em date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar(vencimento);
CREATE INDEX idx_contas_pagar_status ON public.contas_pagar(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_pagar TO authenticated;
GRANT ALL ON public.contas_pagar TO service_role;

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam contas_pagar"
  ON public.contas_pagar FOR ALL
  TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

CREATE TRIGGER update_contas_pagar_updated_at
  BEFORE UPDATE ON public.contas_pagar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONTAS A RECEBER ============
CREATE TABLE public.contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  cliente text,
  reserva_id uuid,
  recebido_em date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(vencimento);
CREATE INDEX idx_contas_receber_status ON public.contas_receber(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_receber TO authenticated;
GRANT ALL ON public.contas_receber TO service_role;

ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internos gerenciam contas_receber"
  ON public.contas_receber FOR ALL
  TO authenticated
  USING (is_internal_user(auth.uid()))
  WITH CHECK (is_internal_user(auth.uid()));

CREATE TRIGGER update_contas_receber_updated_at
  BEFORE UPDATE ON public.contas_receber
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
