-- Atualiza informações de Santiago de Compostela 2027
-- Aplicada no Lovable Cloud pela extensão, com autorização do usuário.
-- Registrada por KODRAK AI em 2026-11-13T21:05:45.044Z

UPDATE public.expedicoes
SET
  regiao = 'Santiago de Compostela — Espanha',
  duracao = '5 dias',
  mensagem_comercial_publica = NULL,
  inclui = (
    SELECT jsonb_agg(
      CASE
        WHEN lower(item) LIKE 'hospedagem%' THEN to_jsonb('Hospedagem: Inclusa durante a vigência do pacote, a partir do check-in até o check-out.'::text)
        WHEN lower(item) LIKE 'alimentação%' THEN to_jsonb('Alimentação: Inclusa durante a vigência do pacote, a partir do check-in até o check-out.'::text)
        ELSE to_jsonb(item)
      END
    )
    FROM jsonb_array_elements_text(inclui) AS value(item)
  ),
  requisitos = (
    SELECT jsonb_agg(
      CASE
        WHEN lower(item) LIKE 'reserva e confirmação:%' THEN to_jsonb('Mediante assinatura do contrato de prestação de serviços e quitação integral (100%) do valor do pacote contratado.'::text)
        ELSE to_jsonb(item)
      END
    )
    FROM jsonb_array_elements_text(requisitos) AS value(item)
  )
WHERE slug = 'caminho-de-santiago';
