-- 1. Adicionar novos campos à tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS primeira_pagina_visitada TEXT,
ADD COLUMN IF NOT EXISTS ultima_pagina_visitada TEXT,
ADD COLUMN IF NOT EXISTS data_primeira_visita TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS data_conversao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quantidade_visitas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS dispositivo TEXT,
ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Brasil';

-- 2. Função para sanitizar a origem do lead
CREATE OR REPLACE FUNCTION public.sanitizar_origem_lead()
RETURNS TRIGGER AS $$
DECLARE
    origem_sanitizada TEXT;
BEGIN
    origem_sanitizada := NEW.origem;
    
    -- Se a origem for nula ou vazia, tenta usar utm_source
    IF origem_sanitizada IS NULL OR origem_sanitizada = '' THEN
        origem_sanitizada := NEW.utm_source;
    END IF;

    -- Lista de origens técnicas a serem ignoradas/substituídas
    IF origem_sanitizada ILIKE '%lovable.dev%' 
       OR origem_sanitizada ILIKE '%lovableproject.com%' 
       OR origem_sanitizada ILIKE '%localhost%' 
       OR origem_sanitizada ILIKE '%gptengineer.app%'
       OR origem_sanitizada IS NULL
    THEN
        -- Se for técnica, tenta classificar melhor ou deixa como 'Direto'
        IF NEW.utm_source IS NOT NULL AND NEW.utm_source != '' THEN
            origem_sanitizada := NEW.utm_source;
        ELSE
            origem_sanitizada := 'Direto';
        END IF;
    END IF;

    -- Padronização de nomes comuns
    IF origem_sanitizada ILIKE '%instagram%' THEN origem_sanitizada := 'Instagram';
    ELSIF origem_sanitizada ILIKE '%facebook%' THEN origem_sanitizada := 'Facebook';
    ELSIF origem_sanitizada ILIKE '%google%' AND (NEW.utm_medium = 'cpc' OR NEW.utm_medium = 'ads') THEN origem_sanitizada := 'Google Ads';
    ELSIF origem_sanitizada ILIKE '%google%' THEN origem_sanitizada := 'Google Orgânico';
    ELSIF origem_sanitizada ILIKE '%whatsapp%' THEN origem_sanitizada := 'WhatsApp';
    END IF;

    NEW.origem := origem_sanitizada;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger para sanitização
DROP TRIGGER IF EXISTS trg_sanitizar_origem_lead ON public.leads;
CREATE TRIGGER trg_sanitizar_origem_lead
BEFORE INSERT OR UPDATE OF origem, utm_source ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.sanitizar_origem_lead();

-- 4. Garantir que o campo status também atualize a data de conversão se for 'convertido'
CREATE OR REPLACE FUNCTION public.log_conversao_lead()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.etapa_atendimento = 'convertido' AND (OLD.etapa_atendimento IS NULL OR OLD.etapa_atendimento != 'convertido') THEN
        NEW.data_conversao := now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_conversao_lead ON public.leads;
CREATE TRIGGER trg_log_conversao_lead
BEFORE UPDATE OF etapa_atendimento ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.log_conversao_lead();
