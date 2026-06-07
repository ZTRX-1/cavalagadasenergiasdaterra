-- Função para sincronizar participantes da reserva para a tabela de participantes
CREATE OR REPLACE FUNCTION public.sync_reserva_participantes()
RETURNS TRIGGER AS $$
DECLARE
    part_count INTEGER;
    part_json JSONB;
    i INTEGER;
    p_nome TEXT;
    p_cpf TEXT;
    p_email TEXT;
    p_tel TEXT;
    p_peso NUMERIC;
    p_nasc DATE;
    p_exp TEXT;
BEGIN
    -- Só executa se o status mudar para confirmado ou pago
    IF (NEW.status_operacional = 'reserva_confirmada' OR NEW.status_financeiro = 'pago_integralmente') THEN
        
        -- Verifica se já existem participantes para esta reserva
        SELECT count(*) INTO part_count FROM public.participantes WHERE reserva_id = NEW.id;
        
        -- Se não houver participantes cadastrados na tabela, cria-os a partir do JSONB ou da quantidade
        IF part_count = 0 THEN
            -- Pega o JSON de participantes se existir
            part_json := NEW.participantes;
            
            -- Se o JSON for uma lista vazia ou nula, mas temos quantidade, criamos entradas vazias
            IF part_json IS NULL OR jsonb_array_length(part_json) = 0 THEN
                FOR i IN 1..NEW.quantidade_participantes LOOP
                    INSERT INTO public.participantes (
                        reserva_id, expedicao_id, data_id, nome, status
                    ) VALUES (
                        NEW.id, NEW.expedicao_id, NEW.data_id, 
                        CASE WHEN i = 1 THEN NEW.cliente_nome ELSE '(preencher)' END,
                        'confirmado'
                    );
                END LOOP;
            ELSE
                -- Se temos JSON, iteramos sobre ele
                FOR i IN 0..jsonb_array_length(part_json) - 1 LOOP
                    p_nome := (part_json->i->>'nome');
                    p_cpf := (part_json->i->>'cpf');
                    p_email := (part_json->i->>'email');
                    p_tel := (part_json->i->>'telefone');
                    p_peso := (part_json->i->>'peso')::NUMERIC;
                    p_nasc := (part_json->i->>'data_nascimento')::DATE;
                    p_exp := (part_json->i->>'experiencia');

                    INSERT INTO public.participantes (
                        reserva_id, expedicao_id, data_id, nome, cpf, email, telefone, peso, data_nascimento, experiencia_equestre, status
                    ) VALUES (
                        NEW.id, NEW.expedicao_id, NEW.data_id, 
                        COALESCE(p_nome, CASE WHEN i = 0 THEN NEW.cliente_nome ELSE '(preencher)' END),
                        COALESCE(p_cpf, CASE WHEN i = 0 THEN NEW.cliente_cpf ELSE NULL END),
                        COALESCE(p_email, CASE WHEN i = 0 THEN NEW.cliente_email ELSE NULL END),
                        COALESCE(p_tel, CASE WHEN i = 0 THEN NEW.cliente_telefone ELSE NULL END),
                        p_peso, p_nasc, p_exp, 'confirmado'
                    );
                END LOOP;
                
                -- Se a quantidade de participantes no JSON for menor que a quantidade_participantes da reserva, completa com vazios
                IF jsonb_array_length(part_json) < NEW.quantidade_participantes THEN
                    FOR i IN jsonb_array_length(part_json) + 1..NEW.quantidade_participantes LOOP
                        INSERT INTO public.participantes (
                            reserva_id, expedicao_id, data_id, nome, status
                        ) VALUES (
                            NEW.id, NEW.expedicao_id, NEW.data_id, '(preencher)', 'confirmado'
                        );
                    END LOOP;
                END IF;
            END IF;
            
            -- Registra no histórico da reserva
            INSERT INTO public.reserva_historico (reserva_id, tipo, descricao)
            VALUES (NEW.id, 'sistema', 'Participantes gerados automaticamente após confirmação/pagamento da reserva.');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função após insert ou update na tabela de reservas
DROP TRIGGER IF EXISTS tr_sync_reserva_participantes ON public.reservas;
CREATE TRIGGER tr_sync_reserva_participantes
AFTER INSERT OR UPDATE OF status_operacional, status_financeiro
ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.sync_reserva_participantes();

-- Garantir que superadmin e admin podem excluir reservas
GRANT DELETE ON public.reservas TO authenticated;
GRANT DELETE ON public.participantes TO authenticated;
GRANT DELETE ON public.reserva_historico TO authenticated;
GRANT DELETE ON public.pagamentos TO authenticated;
GRANT DELETE ON public.documentos TO authenticated;
