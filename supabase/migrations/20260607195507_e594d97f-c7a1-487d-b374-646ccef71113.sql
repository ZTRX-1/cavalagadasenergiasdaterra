-- 1. Garantir que a tabela de participantes tenha todas as colunas necessárias (já verificadas via schema)

-- 2. Função para criar participantes automaticamente ao inserir uma reserva
CREATE OR REPLACE FUNCTION public.auto_criar_participantes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    i integer;
    v_lead record;
BEGIN
    -- Se já existirem participantes para esta reserva, não faz nada
    IF EXISTS (SELECT 1 FROM public.participantes WHERE reserva_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Tenta buscar dados do lead se houver lead_id
    IF NEW.lead_id IS NOT NULL THEN
        SELECT * INTO v_lead FROM public.leads WHERE id = NEW.lead_id;
    END IF;

    -- Cria o primeiro participante (responsável)
    INSERT INTO public.participantes (
        reserva_id,
        expedicao_id,
        data_id,
        nome,
        email,
        telefone,
        cpf,
        peso,
        data_nascimento,
        experiencia_equestre,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.expedicao_id,
        NEW.data_id,
        COALESCE(NEW.cliente_nome, v_lead.nome, 'Responsável'),
        COALESCE(NEW.cliente_email, v_lead.email),
        COALESCE(NEW.cliente_telefone, v_lead.telefone),
        COALESCE(NEW.cliente_cpf, v_lead.cpf),
        v_lead.peso,
        v_lead.data_nascimento,
        v_lead.experiencia_equestre,
        'pendente',
        now(),
        now()
    );

    -- Cria os demais participantes como "(preencher)"
    IF NEW.quantidade_participantes > 1 THEN
        FOR i IN 2..NEW.quantidade_participantes LOOP
            INSERT INTO public.participantes (
                reserva_id,
                expedicao_id,
                data_id,
                nome,
                status,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                NEW.expedicao_id,
                NEW.data_id,
                '(preencher)',
                'pendente',
                now(),
                now()
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$function$;

-- Trigger para auto_criar_participantes
DROP TRIGGER IF EXISTS tr_auto_criar_participantes ON public.reservas;
CREATE TRIGGER tr_auto_criar_participantes
AFTER INSERT ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.auto_criar_participantes();


-- 3. Função para atualizar vagas disponíveis automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_vagas_disponiveis()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_data_id uuid;
    v_ocupadas integer;
    v_total integer;
BEGIN
    -- Pega o data_id do participante (novo ou antigo)
    v_data_id := COALESCE(NEW.data_id, OLD.data_id);
    
    IF v_data_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Conta participantes confirmados para esta data
    -- Consideramos 'confirmado' como ocupando vaga
    SELECT count(*) INTO v_ocupadas
    FROM public.participantes
    WHERE data_id = v_data_id AND status = 'confirmado';

    -- Pega o total de vagas da data
    SELECT vagas_total INTO v_total
    FROM public.datas
    WHERE id = v_data_id;

    -- Atualiza as vagas disponíveis
    UPDATE public.datas
    SET vagas_disponiveis = GREATEST(0, v_total - v_ocupadas),
        updated_at = now()
    WHERE id = v_data_id;

    RETURN NULL;
END;
$function$;

-- Trigger para atualizar_vagas_disponiveis (ao inserir, atualizar ou deletar participantes)
DROP TRIGGER IF EXISTS tr_atualizar_vagas_disponiveis ON public.participantes;
CREATE TRIGGER tr_atualizar_vagas_disponiveis
AFTER INSERT OR UPDATE OR DELETE ON public.participantes
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_vagas_disponiveis();

-- 4. Garantir que as tabelas tenham RLS e Grants corretos (Boilerplate necessário)
GRANT ALL ON public.participantes TO authenticated;
GRANT ALL ON public.participantes TO service_role;
GRANT ALL ON public.datas TO authenticated;
GRANT ALL ON public.datas TO service_role;
