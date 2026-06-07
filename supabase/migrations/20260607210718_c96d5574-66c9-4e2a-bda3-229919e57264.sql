-- 1. Atualizar a função de confirmação de reserva para usar os dados do JSONB
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
BEGIN
    -- Verifica se o status mudou para um estado de confirmação ou se já está confirmado e a quantidade mudou
    IF (NEW.status_operacional IN ('reserva_confirmada', 'participante_confirmado') OR NEW.status_pagamento = 'confirmado') THEN
        
        -- Se não houver dados no JSONB, cai no comportamento antigo (placeholders) apenas como fallback
        IF NEW.participantes IS NULL OR jsonb_array_length(NEW.participantes) = 0 THEN
            -- ... comportamento de fallback mantido para segurança ...
             IF NOT EXISTS (SELECT 1 FROM public.participantes WHERE reserva_id = NEW.id) THEN
                INSERT INTO public.participantes (reserva_id, expedicao_id, data_id, nome, email, telefone, status)
                VALUES (NEW.id, NEW.expedicao_id, NEW.data_id, NEW.cliente_nome, NEW.cliente_email, NEW.cliente_telefone, 'confirmado');
             END IF;
        ELSE
            -- Itera sobre o array de participantes no JSONB da reserva
            FOR participante_record IN SELECT * FROM jsonb_array_elements(NEW.participantes)
            LOOP
                p_nome := participante_record->>'nome';
                p_peso := (participante_record->>'peso')::NUMERIC;
                p_experiencia := participante_record->>'experiencia';
                p_idade := (participante_record->>'idade')::INTEGER;
                
                -- Se for o primeiro participante e os dados de contato estiverem vazios no JSON, tenta pegar da reserva
                IF p_nome = NEW.cliente_nome THEN
                    p_email := NEW.cliente_email;
                    p_telefone := NEW.cliente_telefone;
                    p_cpf := NEW.cliente_cpf;
                ELSE
                    p_email := NULL;
                    p_telefone := NULL;
                    p_cpf := NULL;
                END IF;

                -- Estima data de nascimento se não fornecida (baseado na idade)
                p_nascimento := CURRENT_DATE - (p_idade || ' years')::INTERVAL;

                -- Insere ou atualiza o participante (evita duplicatas pelo nome na mesma reserva se necessário, ou apenas insere se for a primeira vez)
                -- Aqui usamos apenas inserção se não existir nenhum participante ainda para simplificar, 
                -- já que o trigger roda na mudança de status.
                IF NOT EXISTS (SELECT 1 FROM public.participantes WHERE reserva_id = NEW.id AND nome = p_nome) THEN
                    INSERT INTO public.participantes (
                        reserva_id,
                        expedicao_id,
                        data_id,
                        nome,
                        email,
                        telefone,
                        cpf,
                        peso,
                        experiencia_equestre,
                        data_nascimento,
                        status,
                        status_motivo
                    ) VALUES (
                        NEW.id,
                        NEW.expedicao_id,
                        NEW.data_id,
                        p_nome,
                        p_email,
                        p_telefone,
                        p_cpf,
                        p_peso,
                        p_experiencia,
                        p_nascimento,
                        'confirmado',
                        'Criado via confirmação de reserva'
                    );
                END IF;
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- 2. Criar função para gerar o resumo do lead (Memória do Lead)
CREATE OR REPLACE FUNCTION public.gerar_resumo_ia_lead()
RETURNS trigger AS $$
DECLARE
    resumo TEXT;
    total_pessoas INTEGER;
BEGIN
    total_pessoas := COALESCE(NEW.quantidade_pessoas, 1);
    
    resumo := format(
        'Lead interessado em %s para %s participante(s). %s. Forma de pagamento: %s. Cadastro realizado pelo %s.',
        COALESCE(NEW.expedicao_interesse, 'expedição não informada'),
        total_pessoas,
        CASE 
            WHEN NEW.experiencia_equestre IS NOT NULL AND NEW.experiencia_equestre <> '' 
            THEN 'Experiência: ' || NEW.experiencia_equestre 
            ELSE 'Experiência não informada' 
        END,
        COALESCE((SELECT forma_pagamento FROM public.reservas WHERE lead_id = NEW.id LIMIT 1), 'Não definida'),
        COALESCE(NEW.origem, 'Site')
    );

    NEW.resumo_ia := resumo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger para gerar o resumo ao inserir ou atualizar lead
DROP TRIGGER IF EXISTS tr_gerar_resumo_lead ON public.leads;
CREATE TRIGGER tr_gerar_resumo_lead
BEFORE INSERT OR UPDATE OF expedicao_interesse, quantidade_pessoas, experiencia_equestre, origem
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.gerar_resumo_ia_lead();

-- 4. Garantir que o lead herda os campos do formulário corretamente na Edge Function (verificar campos)
-- Adicionando colunas faltantes se necessário (embora o read_query mostre que a maioria existe)
-- Apenas garantindo permissões
GRANT ALL ON public.participantes TO service_role;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.reservas TO service_role;
