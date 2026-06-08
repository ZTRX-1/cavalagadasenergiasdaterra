-- Garantir que o bucket 'avatars' exista e seja público (opcional, dependendo do design)
-- Mas aqui focamos nas políticas de acesso aos objetos.

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Permite inserção: o nome do arquivo deve começar com o ID do usuário (ou estar na pasta com o ID)
CREATE POLICY "Users upload own avatar" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permite atualização
CREATE POLICY "Users update own avatar" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permite exclusão
CREATE POLICY "Users delete own avatar" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permite que todos os usuários autenticados (ou público) vejam os avatares
CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'avatars');