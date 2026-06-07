-- 1. Adicionar colunas faltantes ao Lead para rastreabilidade total
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS canal_venda TEXT;

-- 2. Refinar a função de resumo IA para ser mais detalhada conforme solicitado
CREATE OR REPLACE FUNCTION public.gerar_resumo_ia_lead()
RETURNS trigger AS $$
DECLARE
    resumo TEXT;
    p_peso TEXT;
    p_exp TEXT;
BEGIN
    p_peso := CASE WHEN NEW.peso IS NOT NULL THEN NEW.peso::TEXT || 'kg' ELSE 'não informado' END;
    p_exp := COALESCE(NEW.experiencia_equestre, 'não informada');

    resumo := format(
        'Lead: %s. Expedição: %s. Participantes: %s. Experiência: %s. Peso: %s. Pagamento: %s. Origem: %s. Cadastro via Site.',
        NEW.nome,
        COALESCE(NEW.expedicao_interesse, 'Não informada'),
        COALESCE(NEW.quantidade_pessoas, 1),
        p_exp,
        p_peso,
        COALESCE(NEW.forma_pagamento, 'A definir'),
        COALESCE(NEW.origem, 'Site')
    );

    NEW.resumo_ia := resumo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Garantir que o trigger está ativo
DROP TRIGGER IF EXISTS tr_gerar_resumo_lead ON public.leads;
CREATE TRIGGER tr_gerar_resumo_lead
BEFORE INSERT OR UPDATE OF nome, expedicao_interesse, quantidade_pessoas, experiencia_equestre, origem, peso, forma_pagamento
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.gerar_resumo_ia_lead();
