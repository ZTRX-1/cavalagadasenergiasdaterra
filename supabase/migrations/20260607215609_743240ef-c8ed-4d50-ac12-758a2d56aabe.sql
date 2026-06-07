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
    v_idade TEXT := 'Não informada';
    v_tipo_grupo TEXT := 'individual';
BEGIN
    -- Busca dados da reserva associada se existirem
    SELECT * INTO res_record FROM public.reservas WHERE lead_id = NEW.id OR id = NEW.id LIMIT 1;

    -- 1. INFERÊNCIA DE PERFIL
    IF NEW.data_nascimento IS NOT NULL THEN
        v_idade := date_part('year', age(NEW.data_nascimento)) || ' anos';
    END IF;

    IF NEW.quantidade_pessoas > 2 THEN
        v_tipo_grupo := 'família/amigos';
    ELSIF NEW.quantidade_pessoas = 2 THEN
        v_tipo_grupo := 'casal/amigos';
    ELSE
        v_tipo_grupo := 'individual';
    END IF;

    v_perfil := format('Origem: %s/%s. Idade: %s. Grupo: %s (%s pessoas).', 
        COALESCE(NEW.cidade, 'Não informada'), 
        COALESCE(NEW.estado, '-'),
        v_idade,
        v_tipo_grupo,
        COALESCE(NEW.quantidade_pessoas, 1)
    );

    -- 2. INFERÊNCIA DE OBJETIVOS
    v_objetivos := 'Turismo de experiência e contato com a natureza.';
    IF NEW.observacoes ILIKE '%aventura%' OR NEW.expedicao_interesse ILIKE '%travessia%' THEN
        v_objetivos := 'Turismo de aventura, superação e desafios técnicos.';
    ELSIF NEW.observacoes ILIKE '%descansar%' OR NEW.observacoes ILIKE '%paz%' OR NEW.observacoes ILIKE '%tranquil%' THEN
        v_objetivos := 'Desconexão, relaxamento e busca por tranquilidade.';
    ELSIF NEW.expedicao_interesse ILIKE '%mulher%' THEN
        v_objetivos := 'Experiência exclusiva para o público feminino.';
    ELSIF NEW.observacoes ILIKE '%grupo%' OR NEW.observacoes ILIKE '%conhecer pessoas%' THEN
        v_objetivos := 'Integração em grupo e socialização.';
    END IF;

    -- 3. INFERÊNCIA DE INTERESSES
    v_interesses := format('Expedição: %s.', COALESCE(NEW.expedicao_interesse, 'Turismo equestre'));
    IF NEW.experiencia_equestre IS NOT NULL AND NEW.experiencia_equestre != '' THEN
        v_interesses := v_interesses || ' Nível de experiência: ' || NEW.experiencia_equestre || '.';
    END IF;
    
    IF NEW.expedicao_interesse ILIKE '%Canastra%' THEN
        v_interesses := v_interesses || ' Interesses específicos: Natureza, Cultura local, Gastronomia (Queijos).';
    ELSIF NEW.expedicao_interesse ILIKE '%Pantanal%' THEN
        v_interesses := v_interesses || ' Interesses específicos: Observação de fauna, Safari, Biodiversidade.';
    ELSIF NEW.expedicao_interesse ILIKE '%Marajó%' THEN
        v_interesses := v_interesses || ' Interesses específicos: Cultura paraense, Búfalos, Praias de rio.';
    END IF;

    -- 4. INFERÊNCIA DE RESTRIÇÕES
    v_restricoes := 'Nenhuma informada.';
    IF (NEW.restricoes_alimentares IS NOT NULL AND NEW.restricoes_alimentares != '') OR 
       (NEW.observacoes_medicas IS NOT NULL AND NEW.observacoes_medicas != '') THEN
        v_restricoes := '';
        IF NEW.restricoes_alimentares IS NOT NULL AND NEW.restricoes_alimentares != '' THEN
            v_restricoes := 'Alimentares: ' || NEW.restricoes_alimentares;
        END IF;
        IF NEW.observacoes_medicas IS NOT NULL AND NEW.observacoes_medicas != '' THEN
            IF v_restricoes != '' THEN v_restricoes := v_restricoes || '. '; END IF;
            v_restricoes := v_restricoes || 'Médicas/Físicas: ' || NEW.observacoes_medicas;
        END IF;
    END IF;
    
    -- Tenta consolidar restrições dos participantes da reserva
    IF res_record.id IS NOT NULL AND res_record.participantes IS NOT NULL THEN
        FOR r IN SELECT * FROM jsonb_to_recordset(res_record.participantes) AS x(nome TEXT, restricoes_alimentares TEXT, observacoes_medicas TEXT)
        LOOP
            IF (r.restricoes_alimentares IS NOT NULL AND r.restricoes_alimentares != '') OR 
               (r.observacoes_medicas IS NOT NULL AND r.observacoes_medicas != '') THEN
                IF v_restricoes = 'Nenhuma informada.' THEN v_restricoes := ''; END IF;
                v_restricoes := v_restricoes || format(E'\n- %s: %s %s', r.nome, COALESCE(r.restricoes_alimentares, ''), COALESCE(r.observacoes_medicas, ''));
            END IF;
        END LOOP;
    END IF;

    -- 5. INFERÊNCIA DE ORÇAMENTO
    v_orcamento := format('Valor total: R$ %s (%s participantes).', 
        TO_CHAR(COALESCE(res_record.valor_total, NEW.valor_estimado, 0), 'FM999G999G990D00'),
        COALESCE(NEW.quantidade_pessoas, 1)
    );
    IF NEW.forma_pagamento IS NOT NULL OR res_record.forma_pagamento IS NOT NULL THEN
        v_orcamento := v_orcamento || ' Forma preferencial: ' || COALESCE(res_record.forma_pagamento, NEW.forma_pagamento) || '.';
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
        '%s, %s, residente em %s/%s.
Interessado na expedição %s para um grupo de %s participantes.
Busca %s
Orçamento estimado: %s.',
        NEW.nome, v_idade, COALESCE(NEW.cidade, 'Não informada'), COALESCE(NEW.estado, '-'),
        COALESCE(NEW.expedicao_interesse, 'Não informada'), 
        COALESCE(NEW.quantidade_pessoas, 1),
        LOWER(v_objetivos),
        v_orcamento
    );

    IF v_restricoes != '' AND v_restricoes != 'Nenhuma informada.' THEN
        resumo := resumo || E'\n\nRestrições/Observações:\n' || v_restricoes;
    END IF;

    NEW.resumo_ia := resumo;
    RETURN NEW;
END;
$$;