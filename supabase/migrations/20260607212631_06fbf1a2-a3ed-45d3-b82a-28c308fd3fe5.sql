
CREATE OR REPLACE FUNCTION public.auto_criar_participantes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    p record;
    v_status text := 'pendente';
BEGIN
    -- Se já existirem participantes para esta reserva, não faz nada
    IF EXISTS (SELECT 1 FROM public.participantes WHERE reserva_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Se a reserva já nasce confirmada ou paga, os participantes já podem nascer confirmados
    IF NEW.status_operacional IN ('reserva_confirmada', 'participante_confirmado') OR NEW.status_financeiro = 'pago_integralmente' THEN
        v_status := 'confirmado';
    END IF;

    -- Se não houver dados no JSONB, cria apenas o responsável como fallback
    IF NEW.participantes IS NULL OR jsonb_array_length(NEW.participantes) = 0 THEN
        INSERT INTO public.participantes (
            reserva_id, expedicao_id, data_id, nome, email, telefone, cpf, status, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.expedicao_id, NEW.data_id, 
            COALESCE(NEW.cliente_nome, 'Responsável'), 
            NEW.cliente_email, NEW.cliente_telefone, NEW.cliente_cpf, 
            v_status, now(), now()
        );
        RETURN NEW;
    END IF;

    -- Cria participantes a partir do JSONB
    FOR p IN SELECT * FROM jsonb_to_recordset(NEW.participantes) AS x(
        nome TEXT, 
        cpf TEXT, 
        data_nascimento DATE, 
        peso NUMERIC, 
        experiencia TEXT,
        telefone TEXT,
        email TEXT
    )
    LOOP
        INSERT INTO public.participantes (
            reserva_id,
            expedicao_id,
            data_id,
            nome,
            cpf,
            data_nascimento,
            peso,
            experiencia_equestre,
            telefone,
            email,
            status,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.expedicao_id,
            NEW.data_id,
            p.nome,
            p.cpf,
            p.data_nascimento,
            p.peso,
            p.experiencia,
            p.telefone,
            p.email,
            v_status,
            now(),
            now()
        );
    END LOOP;

    RETURN NEW;
END;
$function$;
