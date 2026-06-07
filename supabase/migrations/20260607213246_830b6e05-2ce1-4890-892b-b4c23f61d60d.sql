-- 1. Remover gatilhos e funções redundantes/conflitantes
DROP TRIGGER IF EXISTS on_booking_confirmed ON public.reservas;
DROP TRIGGER IF EXISTS tr_auto_criar_participantes ON public.reservas;
DROP TRIGGER IF EXISTS tr_create_participants_on_confirmation ON public.reservas;
DROP TRIGGER IF EXISTS tr_sync_participantes_on_cancellation ON public.reservas;
DROP TRIGGER IF EXISTS tr_sync_reserva_participantes ON public.reservas;

DROP FUNCTION IF EXISTS public.handle_booking_confirmation();
DROP FUNCTION IF EXISTS public.auto_criar_participantes();
DROP FUNCTION IF EXISTS public.sync_participantes_status_from_reserva();
DROP FUNCTION IF EXISTS public.sync_reserva_participantes();

-- 2. Criar a Master Function para sincronização de participantes
CREATE OR REPLACE FUNCTION public.fn_master_sync_participantes()
RETURNS TRIGGER AS $$
DECLARE
    participante_json JSONB;
    v_status_participante TEXT;
    v_data_nascimento DATE;
BEGIN
    -- Determinar o status que os participantes devem ter
    IF NEW.status = 'cancelado' OR NEW.status_operacional IN ('cancelada', 'reembolsada', 'excluida') THEN
        v_status_participante := 'cancelado';
    ELSIF NEW.status_operacional IN ('reserva_confirmada', 'participante_confirmado') OR NEW.status_financeiro = 'pago_integralmente' THEN
        v_status_participante := 'confirmado';
    ELSE
        v_status_participante := 'pendente';
    END IF;

    -- Caso 1: Sincronização de Status (Update de status da reserva)
    -- Se o status mudou, atualizamos todos os participantes vinculados
    IF (TG_OP = 'UPDATE') AND 
       (OLD.status IS DISTINCT FROM NEW.status OR OLD.status_operacional IS DISTINCT FROM NEW.status_operacional OR OLD.status_financeiro IS DISTINCT FROM NEW.status_financeiro) THEN
        
        UPDATE public.participantes
        SET status = v_status_participante,
            updated_at = now(),
            status_changed_at = now()
        WHERE reserva_id = NEW.id;
    END IF;

    -- Caso 2: Criação/Atualização de registros de participantes a partir do JSON da reserva
    -- Executa se for INSERT ou se o campo 'participantes' foi alterado ou se a reserva foi confirmada agora
    IF (TG_OP = 'INSERT') OR 
       (NEW.participantes IS DISTINCT FROM OLD.participantes) OR
       (v_status_participante = 'confirmado' AND (OLD.status_operacional IS DISTINCT FROM NEW.status_operacional OR OLD.status_financeiro IS DISTINCT FROM NEW.status_financeiro)) THEN

        -- Se houver dados no JSONB, processa cada um
        IF NEW.participantes IS NOT NULL AND jsonb_array_length(NEW.participantes) > 0 THEN
            FOR participante_json IN SELECT * FROM jsonb_array_elements(NEW.participantes)
            LOOP
                -- Tentar converter data de nascimento se existir
                BEGIN
                    v_data_nascimento := (participante_json->>'data_nascimento')::DATE;
                EXCEPTION WHEN OTHERS THEN
                    v_data_nascimento := NULL;
                END;

                -- UPSERT logic baseada em reserva_id + nome
                -- (Poderíamos usar CPF, mas nem sempre todos têm CPF no formulário inicial)
                IF EXISTS (SELECT 1 FROM public.participantes WHERE reserva_id = NEW.id AND nome = (participante_json->>'nome')) THEN
                    UPDATE public.participantes
                    SET 
                        cpf = COALESCE(participante_json->>'cpf', cpf),
                        email = COALESCE(participante_json->>'email', email),
                        telefone = COALESCE(participante_json->>'telefone', telefone),
                        data_nascimento = COALESCE(v_data_nascimento, data_nascimento),
                        peso = COALESCE((participante_json->>'peso')::NUMERIC, peso),
                        experiencia_equestre = COALESCE(participante_json->>'experiencia', experiencia_equestre),
                        restricoes_alimentares = COALESCE(participante_json->>'restricoes_alimentares', restricoes_alimentares),
                        status = v_status_participante,
                        expedicao_id = NEW.expedicao_id,
                        data_id = NEW.data_id,
                        updated_at = now()
                    WHERE reserva_id = NEW.id AND nome = (participante_json->>'nome');
                ELSE
                    INSERT INTO public.participantes (
                        reserva_id,
                        expedicao_id,
                        data_id,
                        nome,
                        cpf,
                        email,
                        telefone,
                        data_nascimento,
                        peso,
                        experiencia_equestre,
                        restricoes_alimentares,
                        status,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        NEW.expedicao_id,
                        NEW.data_id,
                        participante_json->>'nome',
                        participante_json->>'cpf',
                        participante_json->>'email',
                        participante_json->>'telefone',
                        v_data_nascimento,
                        (participante_json->>'peso')::NUMERIC,
                        participante_json->>'experiencia',
                        participante_json->>'restricoes_alimentares',
                        v_status_participante,
                        now(),
                        now()
                    );
                END IF;
            END LOOP;
        ELSE
            -- Fallback: Se não tem array de participantes, cria pelo menos o responsável se a reserva for confirmada
            IF v_status_participante = 'confirmado' AND NOT EXISTS (SELECT 1 FROM public.participantes WHERE reserva_id = NEW.id) THEN
                INSERT INTO public.participantes (
                    reserva_id, expedicao_id, data_id, nome, email, telefone, cpf, status, created_at, updated_at
                ) VALUES (
                    NEW.id, NEW.expedicao_id, NEW.data_id, 
                    COALESCE(NEW.cliente_nome, 'Responsável'), 
                    NEW.cliente_email, NEW.cliente_telefone, NEW.cliente_cpf, 
                    v_status_participante, now(), now()
                );
            END IF;
        END IF;
    END IF;

    -- Sincronização de IDs de expedição e data (caso mudem na reserva)
    IF (TG_OP = 'UPDATE') AND (OLD.expedicao_id IS DISTINCT FROM NEW.expedicao_id OR OLD.data_id IS DISTINCT FROM NEW.data_id) THEN
        UPDATE public.participantes
        SET expedicao_id = NEW.expedicao_id,
            data_id = NEW.data_id,
            updated_at = now()
        WHERE reserva_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o trigger unificado
CREATE TRIGGER tr_master_sync_participantes
AFTER INSERT OR UPDATE ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.fn_master_sync_participantes();

-- 4. Ajustar a função de atualização de vagas para garantir que ela reaja a qualquer mudança de status
-- (Já existe, mas vamos reforçar a lógica para ser chamada em qualquer mudança relevante)
CREATE OR REPLACE FUNCTION public.atualizar_vagas_disponiveis()
RETURNS TRIGGER AS $$
DECLARE
    v_data_id uuid;
    v_ocupadas integer;
    v_total integer;
BEGIN
    v_data_id := COALESCE(NEW.data_id, OLD.data_id);
    
    IF v_data_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Conta participantes 'confirmado' para esta data
    SELECT count(*) INTO v_ocupadas
    FROM public.participantes
    WHERE data_id = v_data_id AND status = 'confirmado';

    SELECT vagas_total INTO v_total
    FROM public.datas
    WHERE id = v_data_id;

    UPDATE public.datas
    SET vagas_disponiveis = GREATEST(0, COALESCE(v_total, 0) - v_ocupadas),
        updated_at = now()
    WHERE id = v_data_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- O trigger tr_atualizar_vagas_disponiveis já deve existir na tabela participantes.
-- Vamos garantir que ele cubra INSERT, UPDATE e DELETE.
DROP TRIGGER IF EXISTS tr_atualizar_vagas_disponiveis ON public.participantes;
CREATE TRIGGER tr_atualizar_vagas_disponiveis
AFTER INSERT OR UPDATE OR DELETE ON public.participantes
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_vagas_disponiveis();

-- 5. Garantir permissões
GRANT ALL ON public.participantes TO service_role;
GRANT ALL ON public.participantes TO authenticated;
GRANT ALL ON public.reservas TO service_role;
GRANT ALL ON public.reservas TO authenticated;
