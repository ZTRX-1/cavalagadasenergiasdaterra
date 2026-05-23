-- Expedicoes
CREATE TABLE public.expedicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  descricao_curta text NOT NULL,
  descricao_longa text NOT NULL,
  duracao text NOT NULL,
  nivel text NOT NULL,
  preco numeric(10,2) NOT NULL,
  imagem_url text,
  galeria jsonb NOT NULL DEFAULT '[]'::jsonb,
  inclui jsonb NOT NULL DEFAULT '[]'::jsonb,
  requisitos jsonb NOT NULL DEFAULT '[]'::jsonb,
  roteiro jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Datas
CREATE TABLE public.datas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedicao_id uuid NOT NULL REFERENCES public.expedicoes(id) ON DELETE CASCADE,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  vagas_total int NOT NULL DEFAULT 10,
  vagas_disponiveis int NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'disponivel',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_datas_expedicao ON public.datas(expedicao_id);
CREATE INDEX idx_datas_inicio ON public.datas(data_inicio);

-- Contador de protocolo
CREATE TABLE public.protocolo_counter (
  ano int PRIMARY KEY,
  valor int NOT NULL DEFAULT 0
);

-- Função para gerar próximo protocolo CET-AAAA-NNN
CREATE OR REPLACE FUNCTION public.gerar_protocolo()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano_atual int := EXTRACT(YEAR FROM now())::int;
  novo_valor int;
BEGIN
  INSERT INTO public.protocolo_counter (ano, valor)
  VALUES (ano_atual, 1)
  ON CONFLICT (ano) DO UPDATE SET valor = protocolo_counter.valor + 1
  RETURNING valor INTO novo_valor;

  RETURN 'CET-' || ano_atual::text || '-' || LPAD(novo_valor::text, 3, '0');
END;
$$;

-- Reservas
CREATE TABLE public.reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo text UNIQUE NOT NULL DEFAULT public.gerar_protocolo(),
  expedicao_id uuid REFERENCES public.expedicoes(id) ON DELETE SET NULL,
  data_id uuid REFERENCES public.datas(id) ON DELETE SET NULL,
  expedicao_nome text NOT NULL,
  data_label text NOT NULL,
  responsavel jsonb NOT NULL,
  participantes jsonb NOT NULL DEFAULT '[]'::jsonb,
  adicionais jsonb NOT NULL DEFAULT '{}'::jsonb,
  aceites jsonb NOT NULL DEFAULT '{}'::jsonb,
  quantidade_participantes int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pre_reserva_enviada',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reservas_protocolo ON public.reservas(protocolo);

-- RLS
ALTER TABLE public.expedicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_counter ENABLE ROW LEVEL SECURITY;

-- Public read expedicoes ativas
CREATE POLICY "Expedicoes ativas publicas"
  ON public.expedicoes FOR SELECT
  USING (ativo = true);

-- Public read datas
CREATE POLICY "Datas publicas"
  ON public.datas FOR SELECT
  USING (true);

-- Public insert reservas (sem select público — consulta via server fn)
CREATE POLICY "Qualquer um pode criar reserva"
  ON public.reservas FOR INSERT
  WITH CHECK (true);
