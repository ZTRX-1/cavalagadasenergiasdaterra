
-- Bloco A: novos campos de configuração da Bárbara
ALTER TABLE public.ia_configuracoes
  ADD COLUMN IF NOT EXISTS nome_exibido        text NOT NULL DEFAULT 'Bárbara',
  ADD COLUMN IF NOT EXISTS idiomas             text[] NOT NULL DEFAULT ARRAY['pt','en','es'],
  ADD COLUMN IF NOT EXISTS modo                text NOT NULL DEFAULT 'sombra',
  ADD COLUMN IF NOT EXISTS limite_confianca    numeric(3,2) NOT NULL DEFAULT 0.80,
  ADD COLUMN IF NOT EXISTS gatilhos_handoff    jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assinatura_padrao   text;

-- Constraints de domínio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='ia_configuracoes_modo_chk'
  ) THEN
    ALTER TABLE public.ia_configuracoes
      ADD CONSTRAINT ia_configuracoes_modo_chk
      CHECK (modo IN ('sombra','sugestao','autonomo'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='ia_configuracoes_confianca_chk'
  ) THEN
    ALTER TABLE public.ia_configuracoes
      ADD CONSTRAINT ia_configuracoes_confianca_chk
      CHECK (limite_confianca >= 0 AND limite_confianca <= 1);
  END IF;
END $$;

-- Garante a linha singleton
INSERT INTO public.ia_configuracoes (id, singleton)
VALUES (true, true)
ON CONFLICT DO NOTHING;

-- Bloco H: cargo dedicado
INSERT INTO public.cargos (chave, nome, descricao, cor, protegido, ativo)
VALUES (
  'atendente_ia_supervisor',
  'Atendente IA · Supervisor',
  'Supervisiona a IA Bárbara: caixa de entrada, handoff, base de conhecimento e configurações.',
  '#D4AF37',
  false,
  true
)
ON CONFLICT (chave) DO NOTHING;
