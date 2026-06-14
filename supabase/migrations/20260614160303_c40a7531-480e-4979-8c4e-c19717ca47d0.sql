
-- Bloco F: Base de Conhecimento da Bárbara — estrutura completa

-- Tipos
DO $$ BEGIN
  CREATE TYPE public.ia_kb_tipo AS ENUM (
    'faq','politica','procedimento_interno','expedicao','hospedagem','transporte',
    'pagamento','cancelamento','documentacao','roteiro_atendimento',
    'objecoes_comerciais','seguranca','alimentacao','equipamentos'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ia_kb_escopo AS ENUM ('global','expedicao','data');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ia_kb_prioridade AS ENUM ('baixa','media','alta','critica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extensão da tabela
ALTER TABLE public.ia_knowledge_base
  ADD COLUMN IF NOT EXISTS tipo public.ia_kb_tipo NOT NULL DEFAULT 'faq',
  ADD COLUMN IF NOT EXISTS subcategoria text,
  ADD COLUMN IF NOT EXISTS prioridade public.ia_kb_prioridade NOT NULL DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS idioma text NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS escopo public.ia_kb_escopo NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS expedicao_id uuid REFERENCES public.expedicoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_id uuid REFERENCES public.datas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Preparação Fase 3
  ADD COLUMN IF NOT EXISTS score_relevancia numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_utilizacao timestamptz,
  ADD COLUMN IF NOT EXISTS total_utilizacoes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS embedding_pendente boolean NOT NULL DEFAULT true;

-- Coerência de escopo
ALTER TABLE public.ia_knowledge_base
  DROP CONSTRAINT IF EXISTS ia_kb_escopo_coerente;
ALTER TABLE public.ia_knowledge_base
  ADD CONSTRAINT ia_kb_escopo_coerente CHECK (
    (escopo = 'global' AND expedicao_id IS NULL AND data_id IS NULL) OR
    (escopo = 'expedicao' AND expedicao_id IS NOT NULL AND data_id IS NULL) OR
    (escopo = 'data' AND data_id IS NOT NULL)
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_ia_kb_tipo ON public.ia_knowledge_base(tipo);
CREATE INDEX IF NOT EXISTS idx_ia_kb_categoria ON public.ia_knowledge_base(categoria);
CREATE INDEX IF NOT EXISTS idx_ia_kb_escopo ON public.ia_knowledge_base(escopo);
CREATE INDEX IF NOT EXISTS idx_ia_kb_expedicao ON public.ia_knowledge_base(expedicao_id);
CREATE INDEX IF NOT EXISTS idx_ia_kb_ativo ON public.ia_knowledge_base(ativo);
CREATE INDEX IF NOT EXISTS idx_ia_kb_tags ON public.ia_knowledge_base USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_ia_kb_busca ON public.ia_knowledge_base
  USING gin(to_tsvector('portuguese', coalesce(titulo,'') || ' ' || coalesce(conteudo,'') || ' ' || coalesce(subcategoria,'')));

-- Trigger updated_at + updated_by + invalidar embedding
CREATE OR REPLACE FUNCTION public.tr_ia_kb_atualizacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF TG_OP = 'UPDATE' THEN
    IF auth.uid() IS NOT NULL THEN NEW.updated_by := auth.uid(); END IF;
    IF NEW.conteudo IS DISTINCT FROM OLD.conteudo OR NEW.titulo IS DISTINCT FROM OLD.titulo THEN
      NEW.embedding_pendente := true;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      NEW.created_by := COALESCE(NEW.created_by, auth.uid());
      NEW.updated_by := COALESCE(NEW.updated_by, auth.uid());
    END IF;
    NEW.versao := COALESCE(NEW.versao, 1);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ia_kb_atualizacao ON public.ia_knowledge_base;
CREATE TRIGGER trg_ia_kb_atualizacao
  BEFORE INSERT OR UPDATE ON public.ia_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.tr_ia_kb_atualizacao();

-- Grants (mantém políticas existentes)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_knowledge_base TO authenticated;
GRANT ALL ON public.ia_knowledge_base TO service_role;
