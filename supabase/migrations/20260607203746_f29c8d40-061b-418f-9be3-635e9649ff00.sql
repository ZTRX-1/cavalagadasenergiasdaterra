-- Função para criar participantes automaticamente
CREATE OR REPLACE FUNCTION public.handle_booking_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    i INTEGER;
    existing_count INTEGER;
    p_nome TEXT;
    p_email TEXT;
    p_telefone TEXT;
BEGIN
    -- Verifica se o status mudou para um estado de confirmação
    IF (NEW.status_operacional IN ('reserva_confirmada', 'participante_confirmado') OR NEW.status_pagamento = 'confirmado') THEN
        
        -- Busca dados do lead/reserva para o primeiro participante (responsável)
        p_nome := NEW.cliente_nome;
        p_email := NEW.cliente_email;
        p_telefone := NEW.cliente_telefone;

        -- Verifica quantos participantes já existem para esta reserva
        SELECT count(*) INTO existing_count FROM public.participantes WHERE reserva_id = NEW.id;

        -- Se não existe nenhum, cria o primeiro com os dados do responsável
        IF existing_count = 0 AND NEW.quantidade_participantes > 0 THEN
            INSERT INTO public.participantes (
                reserva_id,
                expedicao_id,
                data_id,
                nome,
                email,
                telefone,
                status
            ) VALUES (
                NEW.id,
                NEW.expedicao_id,
                NEW.data_id,
                p_nome,
                p_email,
                p_telefone,
                'confirmado'
            );
            existing_count := 1;
        END IF;

        -- Cria os demais participantes como "A definir" se a quantidade for maior que os existentes
        FOR i IN (existing_count + 1)..NEW.quantidade_participantes LOOP
            INSERT INTO public.participantes (
                reserva_id,
                expedicao_id,
                data_id,
                nome,
                status
            ) VALUES (
                NEW.id,
                NEW.expedicao_id,
                NEW.data_id,
                'A definir',
                'confirmado'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS tr_create_participants_on_confirmation ON public.reservas;
CREATE TRIGGER tr_create_participants_on_confirmation
AFTER UPDATE ON public.reservas
FOR EACH ROW
WHEN (OLD.status_operacional IS DISTINCT FROM NEW.status_operacional OR OLD.status_pagamento IS DISTINCT FROM NEW.status_pagamento)
EXECUTE FUNCTION public.handle_booking_confirmation();
