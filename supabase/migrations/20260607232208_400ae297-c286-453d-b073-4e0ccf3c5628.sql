-- 1. Adicionar campos de motivação e observações em leads e reservas
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS motivacao_viagem TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS observacoes_importantes TEXT;

ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS motivacao_viagem TEXT;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS observacoes_importantes TEXT;

-- 2. Adicionar checklist operacional em participantes
ALTER TABLE public.participantes ADD COLUMN IF NOT EXISTS cpf_recebido BOOLEAN DEFAULT false;
ALTER TABLE public.participantes ADD COLUMN IF NOT EXISTS pagamento_recebido BOOLEAN DEFAULT false;
ALTER TABLE public.participantes ADD COLUMN IF NOT EXISTS contrato_assinado BOOLEAN DEFAULT false;
ALTER TABLE public.participantes ADD COLUMN IF NOT EXISTS ficha_medica_enviada BOOLEAN DEFAULT false;
ALTER TABLE public.participantes ADD COLUMN IF NOT EXISTS documentacao_aprovada BOOLEAN DEFAULT false;

-- 3. Atualizar a função de reconstrução do resumo da IA para incluir novos campos
CREATE OR REPLACE FUNCTION public.reconstruir_resumo_ia_reserva(reserva_id UUID)
RETURNS TEXT AS $$
DECLARE
    r RECORD;
    p RECORD;
    parts_info TEXT := '';
    resumo TEXT;
BEGIN
    SELECT * INTO r FROM public.reservas WHERE id = reserva_id;
    IF NOT FOUND THEN RETURN NULL; END IF;

    -- Coleta info de participantes
    FOR p IN SELECT * FROM public.participantes WHERE reserva_id = r.id ORDER BY created_at ASC LOOP
        parts_info := parts_info || format(
            E'\n- %s: Peso %skg, Experiência: %s. Nascimento: %s.',
            p.nome, p.peso, p.experiencia_equestre, 
            CASE WHEN p.data_nascimento IS NOT NULL THEN to_char(p.data_nascimento, 'DD/MM/YYYY') ELSE 'Não informada' END
        );
        IF p.restricoes_alimentares IS NOT NULL AND p.restricoes_alimentares <> '' THEN
            parts_info := parts_info || ' Restrições: ' || p.restricoes_alimentares;
        END IF;
        IF p.observacoes_medicas IS NOT NULL AND p.observacoes_medicas <> '' THEN
            parts_info := parts_info || ' Obs Médicas: ' || p.observacoes_medicas;
        END IF;
    END LOOP;

    -- Constrói o resumo estruturado para a IA
    resumo := format(
        E'Resumo da Reserva %s (%s)\n' ||
        E'Cliente Responsável: %s\n' ||
        E'Expedição: %s (%s)\n' ||
        E'Tipo de Viagem: %s\n' ||
        E'Motivação: %s\n' ||
        E'Observações Importantes: %s\n' ||
        E'Valor Total: %s. Forma preferencial: %s\n' ||
        E'Participantes (%s):%s',
        r.protocolo, r.status_operacional,
        r.cliente_nome,
        r.expedicao_nome, r.data_label,
        COALESCE(r.tipo_grupo, 'Não informado'),
        COALESCE(r.motivacao_viagem, 'Não informada'),
        COALESCE(r.observacoes_importantes, 'Nenhuma'),
        to_char(r.valor_total, 'L"R$ "FM999G999G990D00'),
        COALESCE(r.forma_pagamento, 'Não informada'),
        r.quantidade_participantes,
        parts_info
    );

    RETURN resumo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Garantir que o campo 'perfil' do lead também reflita os novos dados
-- (Caso exista uma função similar para leads, se não, as triggers já tratam o sync_participante_to_reserva_json)

-- GRANTs
GRANT SELECT, UPDATE ON public.leads TO authenticated;
GRANT SELECT, UPDATE ON public.reservas TO authenticated;
GRANT SELECT, UPDATE ON public.participantes TO authenticated;
GRANT SELECT, UPDATE ON public.leads TO service_role;
GRANT SELECT, UPDATE ON public.reservas TO service_role;
GRANT SELECT, UPDATE ON public.participantes TO service_role;
