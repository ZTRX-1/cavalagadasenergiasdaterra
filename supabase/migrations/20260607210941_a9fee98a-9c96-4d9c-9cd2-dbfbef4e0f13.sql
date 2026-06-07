CREATE OR REPLACE FUNCTION public.gerar_resumo_ia_lead()
RETURNS trigger AS $$
DECLARE
    resumo TEXT;
    p_exp TEXT;
BEGIN
    p_exp := CASE 
        WHEN NEW.experiencia_equestre IS NULL OR NEW.experiencia_equestre = 'nenhuma' THEN 'Sem experiência prévia'
        ELSE 'Experiência ' || NEW.experiencia_equestre
    END;

    resumo := format(
        'Lead interessado em %s para %s participante(s). %s. Peso: %s. Forma de pagamento %s. Cadastro realizado pelo %s.',
        COALESCE(NEW.expedicao_interesse, 'expedição'),
        COALESCE(NEW.quantidade_pessoas, 1),
        p_exp,
        CASE WHEN NEW.peso IS NOT NULL THEN NEW.peso::TEXT || 'kg' ELSE 'não informado' END,
        COALESCE(NEW.forma_pagamento, 'não informada'),
        COALESCE(NEW.origem, 'site')
    );

    NEW.resumo_ia := resumo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
