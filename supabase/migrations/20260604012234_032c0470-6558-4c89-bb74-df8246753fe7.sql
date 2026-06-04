-- 1) Limpeza de dados de teste (operacional)
TRUNCATE TABLE
  public.reserva_historico,
  public.reserva_documentos,
  public.pagamentos,
  public.participantes,
  public.documentos_central,
  public.lead_conversas,
  public.lead_atividades,
  public.lead_memoria,
  public.webhooks_eventos,
  public.notificacoes_lidas,
  public.activity_logs
RESTART IDENTITY CASCADE;

DELETE FROM public.reservas;
DELETE FROM public.leads;

-- Documentos vinculados a reservas/leads/participantes que sumiram
DELETE FROM public.documentos
  WHERE reserva_id IS NOT NULL OR participante_id IS NOT NULL;

-- 2) Trigger estendido: registra criação automática de reserva a partir de lead
CREATE OR REPLACE FUNCTION public.lead_etapa_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
    VALUES ('lead_criado','lead', NEW.id, jsonb_build_object('nome', NEW.nome, 'origem', NEW.origem, 'etapa', NEW.etapa_atendimento));
    RETURN NEW;
  END IF;

  IF NEW.etapa_atendimento IS DISTINCT FROM OLD.etapa_atendimento THEN
    INSERT INTO public.lead_conversas (lead_id, tipo_evento, conteudo, metadata)
    VALUES (NEW.id, 'alteracao_status',
      'Etapa alterada: ' || OLD.etapa_atendimento || ' → ' || NEW.etapa_atendimento,
      jsonb_build_object('de', OLD.etapa_atendimento, 'para', NEW.etapa_atendimento));

    IF NEW.etapa_atendimento = 'qualificado' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_qualificado','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'pronto_reserva' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_pronto_reserva','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'convertido' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_convertido','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    ELSIF NEW.etapa_atendimento = 'perdido' THEN
      INSERT INTO public.webhooks_eventos (evento, entidade, entidade_id, payload)
      VALUES ('lead_perdido','lead', NEW.id, jsonb_build_object('nome', NEW.nome));
    END IF;

    NEW.ultima_interacao_at := now();
  END IF;

  RETURN NEW;
END;
$function$;