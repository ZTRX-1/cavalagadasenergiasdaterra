-- 1. Limpeza final de possíveis duplicatas remanescentes que impediriam o índice único
DELETE FROM public.participantes a USING public.participantes b 
WHERE a.id > b.id AND a.reserva_id = b.reserva_id AND a.nome = b.nome;

-- 2. Adicionar restrição de unicidade para permitir o ON CONFLICT (reserva_id, nome)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'participantes_reserva_id_nome_key') THEN
        ALTER TABLE public.participantes ADD CONSTRAINT participantes_reserva_id_nome_key UNIQUE (reserva_id, nome);
    END IF;
END $$;

-- 3. Atualizar a função para lidar com INSERT e UPDATE e sincronizar dados JSONB
CREATE OR REPLACE FUNCTION public.handle_booking_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    participante_record JSONB;
    p_nome TEXT;
    p_email TEXT;
    p_telefone TEXT;
    p_cpf TEXT;
    p_peso NUMERIC;
    p_experiencia TEXT;
    p_idade INTEGER;
    p_nascimento DATE;
    p_status TEXT;
    i INTEGER;
BEGIN
    -- Define o status inicial baseado na reserva
    IF (NEW.status_operacional IN ('reserva_confirmada', 'participante_confirmado') OR NEW.status_pagamento = 'confirmado') THEN
        p_status := 'confirmado';
    ELSE
        p_status := 'pendente';
    END IF;

    -- Se houver dados no JSONB, processa cada um
    IF NEW.participantes IS NOT NULL AND jsonb_array_length(NEW.participantes) > 0 THEN
        FOR participante_record IN SELECT * FROM jsonb_array_elements(NEW.participantes)
        LOOP
            p_nome := COALESCE(participante_record->>'nome', 'Participante ' || i);
            p_peso := (participante_record->>'peso')::NUMERIC;
            p_experiencia := participante_record->>'experiencia';
            p_idade := (participante_record->>'idade')::INTEGER;
            
            -- Dados de contato do responsável se o nome bater
            IF p_nome = NEW.cliente_nome THEN
                p_email := NEW.cliente_email;
                p_telefone := NEW.cliente_telefone;
                p_cpf := NEW.cliente_cpf;
            ELSE
                p_email := NULL;
                p_telefone := NULL;
                p_cpf := NULL;
            END IF;

            -- Estima data de nascimento
            p_nascimento := CASE 
                WHEN p_idade IS NOT NULL THEN CURRENT_DATE - (p_idade || ' years')::INTERVAL
                ELSE NULL
            END;

            -- Upsert
            INSERT INTO public.participantes (
                reserva_id, expedicao_id, data_id, nome, email, telefone, cpf, peso, experiencia_equestre, data_nascimento, status
            ) VALUES (
                NEW.id, NEW.expedicao_id, NEW.data_id, p_nome, p_email, p_telefone, p_cpf, p_peso, p_experiencia, p_nascimento, p_status
            )
            ON CONFLICT (reserva_id, nome) DO UPDATE SET
                status = EXCLUDED.status,
                peso = COALESCE(EXCLUDED.peso, participantes.peso),
                experiencia_equestre = COALESCE(EXCLUDED.experiencia_equestre, participantes.experiencia_equestre),
                updated_at = now();
        END LOOP;
    ELSE
        -- Fallback: Se não houver nenhum participante, cria placeholders
        IF NOT EXISTS (SELECT 1 FROM public.participantes WHERE reserva_id = NEW.id) THEN
            FOR i IN 1..COALESCE(NEW.quantidade_participantes, 1) LOOP
                INSERT INTO public.participantes (
                    reserva_id, expedicao_id, data_id, nome, status
                ) VALUES (
                    NEW.id, NEW.expedicao_id, NEW.data_id, 
                    CASE WHEN i = 1 THEN NEW.cliente_nome ELSE 'Participante ' || i END, 
                    p_status
                ) ON CONFLICT (reserva_id, nome) DO NOTHING;
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 4. Ajustar o gatilho para disparar no INSERT também
DROP TRIGGER IF EXISTS on_booking_confirmed ON public.reservas;
CREATE TRIGGER on_booking_confirmed
AFTER INSERT OR UPDATE OF status, status_operacional, status_pagamento, quantidade_participantes, participantes
ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.handle_booking_confirmation();

-- 5. Função de Resumo do Lead (Memória do Lead)
CREATE OR REPLACE FUNCTION public.gerar_resumo_ia_lead()
RETURNS trigger AS $$
DECLARE
    resumo TEXT;
BEGIN
    resumo := format(
        'Lead: %s. Interesse: %s. Grupo: %s pessoas. Experiência: %s. Origem: %s. Cadastrado em: %s.',
        NEW.nome,
        COALESCE(NEW.expedicao_interesse, 'Não informada'),
        COALESCE(NEW.quantidade_pessoas, 1),
        COALESCE(NEW.experiencia_equestre, 'Não informada'),
        COALESCE(NEW.origem, 'Site'),
        to_char(NEW.created_at, 'DD/MM/YYYY')
    );

    NEW.resumo_ia := resumo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_gerar_resumo_lead ON public.leads;
CREATE TRIGGER tr_gerar_resumo_lead
BEFORE INSERT OR UPDATE OF nome, expedicao_interesse, quantidade_pessoas, experiencia_equestre, origem
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.gerar_resumo_ia_lead();
