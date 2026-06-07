
-- Melhora a função de geração de resumo IA do Lead
CREATE OR REPLACE FUNCTION public.gerar_resumo_ia_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 AS $$
DECLARE
    resumo TEXT;
    p_info TEXT := '';
    r RECORD;
    res_record RECORD;
BEGIN
    -- Busca dados da reserva associada se existirem
    SELECT * INTO res_record FROM public.reservas WHERE lead_id = NEW.id OR id = NEW.id LIMIT 1;

    resumo := format(
        'Lead: %s. Contato: %s | %s. Localização: %s/%s. 
Interessado na expedição: %s. Data: %s. Grupo de %s pessoas. 
Forma de pagamento preferencial: %s. Origem: %s.',
        NEW.nome, NEW.email, NEW.telefone, COALESCE(NEW.cidade, 'Não informada'), COALESCE(NEW.estado, '-'),
        COALESCE(NEW.expedicao_interesse, 'Não informada'), 
        COALESCE(NEW.data_interesse::TEXT, 'A definir'), 
        COALESCE(NEW.quantidade_pessoas, 1),
        COALESCE(NEW.forma_pagamento, 'Não informada'),
        COALESCE(NEW.origem, 'Site')
    );

    -- Se houver reserva com participantes (JSONB), adiciona detalhes
    IF res_record.id IS NOT NULL AND res_record.participantes IS NOT NULL THEN
        p_info := E'\n\nParticipantes detalhados:';
        FOR r IN SELECT * FROM jsonb_to_recordset(res_record.participantes) AS x(nome TEXT, idade INT, peso NUMERIC, experiencia TEXT, cpf TEXT)
        LOOP
            p_info := p_info || format(E'\n- %s (%s, %s anos, %skg, exp: %s)', 
                r.nome, 
                COALESCE(r.cpf, 'Sem CPF'),
                COALESCE(r.idade::TEXT, '?'), 
                COALESCE(r.peso::TEXT, '?'), 
                COALESCE(r.experiencia, 'não informada')
            );
        END LOOP;
        resumo := resumo || p_info;
    END IF;

    -- Adiciona informações adicionais
    IF NEW.restricoes_alimentares IS NOT NULL AND NEW.restricoes_alimentares != '' THEN
        resumo := resumo || E'\n\nRestrições alimentares: ' || NEW.restricoes_alimentares;
    END IF;
    
    IF NEW.observacoes IS NOT NULL AND NEW.observacoes != '' THEN
        resumo := resumo || E'\n\nObservações: ' || NEW.observacoes;
    END IF;

    NEW.resumo_ia := resumo;
    RETURN NEW;
END;
$$;

-- Trigger para atualizar o Lead quando a Reserva for criada ou alterada
CREATE OR REPLACE FUNCTION public.sync_reserva_to_lead_summary()
RETURNS trigger AS $$
BEGIN
    -- Força a atualização do resumo_ia do lead disparando o trigger de UPDATE do lead
    UPDATE public.leads SET updated_at = now() WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_reserva_to_lead_summary ON public.reservas;
CREATE TRIGGER tr_sync_reserva_to_lead_summary
AFTER INSERT OR UPDATE OF participantes, responsavel, adicionais ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.sync_reserva_to_lead_summary();
