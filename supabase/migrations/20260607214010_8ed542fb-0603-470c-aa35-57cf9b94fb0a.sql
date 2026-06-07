-- Altera a coluna orcamento para TEXT para suportar descrições formatadas (Etapa 1 Master)
ALTER TABLE public.lead_memoria ALTER COLUMN orcamento TYPE TEXT;

-- Atualiza a função de geração de resumo e memória do Lead
CREATE OR REPLACE FUNCTION public.gerar_resumo_ia_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 AS $$
DECLARE
    resumo TEXT;
    p_info TEXT := '';
    r RECORD;
    res_record RECORD;
    
    -- Campos de Memória
    v_perfil TEXT;
    v_objetivos TEXT;
    v_interesses TEXT;
    v_restricoes TEXT;
    v_orcamento TEXT;
BEGIN
    -- Busca dados da reserva associada se existirem
    SELECT * INTO res_record FROM public.reservas WHERE lead_id = NEW.id OR id = NEW.id LIMIT 1;

    -- 1. INFERÊNCIA DE PERFIL
    v_perfil := format('%s/%s. ', COALESCE(NEW.cidade, 'Não informada'), COALESCE(NEW.estado, '-'));
    IF NEW.quantidade_pessoas > 1 THEN
        v_perfil := v_perfil || 'Viajando em grupo de ' || NEW.quantidade_pessoas || ' pessoas.';
    ELSE
        v_perfil := v_perfil || 'Viajando individualmente.';
    END IF;

    -- 2. INFERÊNCIA DE OBJETIVOS
    v_objetivos := 'Experiência em grupo e contato com a natureza.';
    IF NEW.observacoes ILIKE '%aventura%' OR NEW.expedicao_interesse ILIKE '%travessia%' THEN
        v_objetivos := 'Turismo de aventura e superação.';
    ELSIF NEW.observacoes ILIKE '%descansar%' OR NEW.observacoes ILIKE '%paz%' THEN
        v_objetivos := 'Desconexão e relaxamento.';
    ELSIF NEW.expedicao_interesse ILIKE '%mulher%' THEN
        v_objetivos := 'Experiência exclusiva para mulheres.';
    END IF;

    -- 3. INFERÊNCIA DE INTERESSES
    v_interesses := COALESCE(NEW.expedicao_interesse, 'Turismo equestre');
    IF NEW.expedicao_interesse ILIKE '%Canastra%' THEN
        v_interesses := v_interesses || ', Natureza, Cultura local, Queijos';
    ELSIF NEW.expedicao_interesse ILIKE '%Pantanal%' THEN
        v_interesses := v_interesses || ', Observação de fauna, Safari, Biodiversidade';
    ELSIF NEW.expedicao_interesse ILIKE '%Marajó%' THEN
        v_interesses := v_interesses || ', Búfalos, Cultura paraense, Praia de rio';
    END IF;

    -- 4. INFERÊNCIA DE RESTRIÇÕES
    v_restricoes := '';
    IF NEW.restricoes_alimentares IS NOT NULL AND NEW.restricoes_alimentares != '' THEN
        v_restricoes := 'Alimentar: ' || NEW.restricoes_alimentares;
    END IF;
    IF NEW.observacoes_medicas IS NOT NULL AND NEW.observacoes_medicas != '' THEN
        IF v_restricoes != '' THEN v_restricoes := v_restricoes || '. '; END IF;
        v_restricoes := v_restricoes || 'Médica: ' || NEW.observacoes_medicas;
    END IF;
    
    -- Adiciona restrições dos participantes da reserva se houver
    IF res_record.id IS NOT NULL AND res_record.participantes IS NOT NULL THEN
        FOR r IN SELECT * FROM jsonb_to_recordset(res_record.participantes) AS x(nome TEXT, restricoes_alimentares TEXT, observacoes_medicas TEXT)
        LOOP
            IF (r.restricoes_alimentares IS NOT NULL AND r.restricoes_alimentares != '') OR 
               (r.observacoes_medicas IS NOT NULL AND r.observacoes_medicas != '') THEN
                v_restricoes := v_restricoes || format(E'\n- %s: %s %s', r.nome, COALESCE(r.restricoes_alimentares, ''), COALESCE(r.observacoes_medicas, ''));
            END IF;
        END LOOP;
    END IF;

    -- 5. INFERÊNCIA DE ORÇAMENTO
    v_orcamento := format('Faixa estimada: R$ %s.', TO_CHAR(COALESCE(NEW.valor_estimado, 0), 'FM999G999G990D00'));
    IF NEW.forma_pagamento IS NOT NULL THEN
        v_orcamento := v_orcamento || ' Forma preferencial: ' || NEW.forma_pagamento || '.';
    END IF;

    -- UPSERT na lead_memoria
    INSERT INTO public.lead_memoria (lead_id, perfil, objetivos, interesses, restricoes, orcamento, ultima_atualizacao)
    VALUES (NEW.id, v_perfil, v_objetivos, v_interesses, v_restricoes, v_orcamento, now())
    ON CONFLICT (lead_id) DO UPDATE SET
        perfil = EXCLUDED.perfil,
        objetivos = EXCLUDED.objetivos,
        interesses = EXCLUDED.interesses,
        restricoes = EXCLUDED.restricoes,
        orcamento = EXCLUDED.orcamento,
        ultima_atualizacao = now();

    -- CONSTRUÇÃO DO RESUMO CONSOLIDADO (resumo_ia)
    resumo := format(
        '%s, residente em %s/%s.
Interessado na expedição %s para um grupo de %s participantes.
Busca %s
Forma de pagamento preferencial: %s.',
        NEW.nome, COALESCE(NEW.cidade, 'Não informada'), COALESCE(NEW.estado, '-'),
        COALESCE(NEW.expedicao_interesse, 'Não informada'), 
        COALESCE(NEW.quantidade_pessoas, 1),
        LOWER(v_objetivos),
        COALESCE(NEW.forma_pagamento, 'Não informada')
    );

    IF v_restricoes != '' THEN
        resumo := resumo || E'\n\nObservações relevantes:\n' || v_restricoes;
    END IF;

    NEW.resumo_ia := resumo;
    RETURN NEW;
END;
$$;