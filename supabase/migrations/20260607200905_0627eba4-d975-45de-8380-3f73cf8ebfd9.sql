-- Remove participante_embarcado de referências futuras (o frontend já foi atualizado)
-- Atualiza a função de trigger para sincronizar faturamento ao confirmar reserva

CREATE OR REPLACE FUNCTION public.sync_reserva_participantes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    -- Se o status operacional mudar para reserva_confirmada, garantimos o financeiro
    IF (NEW.status_operacional = 'reserva_confirmada') THEN
        NEW.status_financeiro := 'pago_integralmente';
        NEW.status_pagamento := 'confirmado';
        NEW.valor_pago := NEW.valor_total;
        NEW.saldo_restante := 0;
    END IF;

    -- Só executa a lógica de participantes se o status mudar para confirmado ou pago
    IF (NEW.status_operacional = 'reserva_confirmada' OR NEW.status_financeiro = 'pago_integralmente') THEN
        
        -- Verifica se já existem participantes para esta reserva
        SELECT count(*) INTO part_count FROM public.participantes WHERE reserva_id = NEW.id;
        
        -- Se não houver participantes cadastrados na tabela, cria-os
        IF part_count = 0 THEN
            part_json := NEW.participantes;
            
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
                        p_cpf, p_email, p_tel, p_peso, p_nasc, p_exp, 'confirmado'
                    );
                END LOOP;
            END IF;
        ELSE
            -- Se já existem, atualiza o status deles para confirmado
            UPDATE public.participantes 
            SET status = 'confirmado'
            WHERE reserva_id = NEW.id AND status = 'pendente';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;
