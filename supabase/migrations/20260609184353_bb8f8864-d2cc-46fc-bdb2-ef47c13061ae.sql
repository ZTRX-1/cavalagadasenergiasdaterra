ALTER TABLE public.expedicoes ADD COLUMN mensagem_comercial_publica TEXT;
COMMENT ON COLUMN public.expedicoes.mensagem_comercial_publica IS 'Mensagem comercial exibida no site público em vez dos valores reais.';
