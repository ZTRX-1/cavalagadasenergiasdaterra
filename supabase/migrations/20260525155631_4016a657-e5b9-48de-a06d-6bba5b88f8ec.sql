
-- ============================================
-- FRENTE A: limpeza, protocolos seguros, slug único
-- ============================================

-- 1) Zerar dados transacionais de teste
DELETE FROM public.lead_atividades;
DELETE FROM public.leads;
DELETE FROM public.documentos;
DELETE FROM public.participantes;
DELETE FROM public.reservas;
DELETE FROM public.activity_logs;
TRUNCATE TABLE public.protocolo_counter;
TRUNCATE TABLE public.protocolo_lead_counter;

-- Remover expedição-fantasma "Nova expedição" de testes
DELETE FROM public.expedicoes WHERE slug = 'nova-expedicao' AND status = 'rascunho';

-- 2) Protocolos seguros (token alfanumérico aleatório, não sequencial)
CREATE OR REPLACE FUNCTION public.gerar_protocolo()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano_atual int := EXTRACT(YEAR FROM now())::int;
  token text;
  tentativas int := 0;
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sem 0/O/1/I para legibilidade
  i int;
  novo text;
BEGIN
  LOOP
    token := '';
    FOR i IN 1..6 LOOP
      token := token || substr(alfabeto, (floor(random() * length(alfabeto))::int) + 1, 1);
    END LOOP;
    novo := 'CET-' || ano_atual::text || '-' || token;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.reservas WHERE protocolo = novo);
    tentativas := tentativas + 1;
    IF tentativas > 20 THEN
      RAISE EXCEPTION 'Não foi possível gerar protocolo único';
    END IF;
  END LOOP;
  RETURN novo;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_protocolo_lead()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano_atual int := EXTRACT(YEAR FROM now())::int;
  token text;
  tentativas int := 0;
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  novo text;
BEGIN
  LOOP
    token := '';
    FOR i IN 1..6 LOOP
      token := token || substr(alfabeto, (floor(random() * length(alfabeto))::int) + 1, 1);
    END LOOP;
    novo := 'LEAD-' || ano_atual::text || '-' || token;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.leads WHERE protocolo = novo);
    tentativas := tentativas + 1;
    IF tentativas > 20 THEN
      RAISE EXCEPTION 'Não foi possível gerar protocolo lead único';
    END IF;
  END LOOP;
  RETURN novo;
END;
$$;

-- 3) Slug único em expedicoes (UNIQUE constraint já existe via tabela; criar função helper)
CREATE OR REPLACE FUNCTION public.slugify_unique_expedicao(base text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidato text;
  base_clean text;
  i int := 1;
BEGIN
  base_clean := lower(regexp_replace(unaccent(coalesce(base, 'expedicao')), '[^a-zA-Z0-9]+', '-', 'g'));
  base_clean := regexp_replace(base_clean, '(^-+|-+$)', '', 'g');
  IF base_clean = '' THEN base_clean := 'expedicao'; END IF;
  candidato := base_clean;
  WHILE EXISTS (SELECT 1 FROM public.expedicoes WHERE slug = candidato) LOOP
    i := i + 1;
    candidato := base_clean || '-' || i::text;
  END LOOP;
  RETURN candidato;
END;
$$;
