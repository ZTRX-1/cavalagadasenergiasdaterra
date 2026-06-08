CREATE TABLE IF NOT EXISTS public.internal_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- Permissões básicas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_messages TO authenticated;
GRANT ALL ON public.internal_messages TO service_role;

-- Políticas de RLS para mensagens
CREATE POLICY "Users can view their own sent/received messages" 
    ON public.internal_messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
    ON public.internal_messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own received messages" 
    ON public.internal_messages FOR UPDATE 
    USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() 
RETURNS TRIGGER AS $$ 
BEGIN 
    NEW.updated_at = now(); 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_internal_messages_updated_at 
    BEFORE UPDATE ON public.internal_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Garantir que a bio e especialidades existam no profile (caso não existam)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'especialidades') THEN
        ALTER TABLE public.profiles ADD COLUMN especialidades TEXT[];
    END IF;
END $$;
