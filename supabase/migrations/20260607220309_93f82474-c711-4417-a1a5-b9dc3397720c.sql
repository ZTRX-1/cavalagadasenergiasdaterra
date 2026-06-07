CREATE OR REPLACE FUNCTION fn_sync_participante_to_reserva_json()
RETURNS TRIGGER AS $$
BEGIN
    -- Reconstrói o JSONB de participantes na reserva sempre que um participante é alterado
    UPDATE public.reservas
    SET participantes = (
        SELECT jsonb_agg(
            jsonb_build_object(
                'nome', nome,
                'cpf', cpf,
                'email', email,
                'telefone', telefone,
                'peso', peso,
                'data_nascimento', data_nascimento,
                'experiencia', experiencia_equestre,
                'restricoes_alimentares', restricoes_alimentares,
                'observacoes_medicas', observacoes_medicas
            )
        )
        FROM public.participantes
        WHERE reserva_id = COALESCE(NEW.reserva_id, OLD.reserva_id)
    ),
    updated_at = now()
    WHERE id = COALESCE(NEW.reserva_id, OLD.reserva_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_participante_to_reserva_json
AFTER INSERT OR UPDATE OR DELETE ON public.participantes
FOR EACH ROW EXECUTE FUNCTION fn_sync_participante_to_reserva_json();
