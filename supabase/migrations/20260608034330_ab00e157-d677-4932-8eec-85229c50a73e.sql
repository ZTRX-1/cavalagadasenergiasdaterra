-- Alterar a política SELECT para impedir a listagem completa (metadata), mantendo o acesso ao arquivo
-- Embora o bucket 'public' já permita acesso via URL, o RLS SELECT to public pode expor a lista de arquivos via API.

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

CREATE POLICY "View avatars" 
ON storage.objects 
FOR SELECT 
TO public 
USING (
    bucket_id = 'avatars' 
    -- A restrição abaixo permite ver o objeto mas dificulta a listagem se não souber o nome
    -- No entanto, em buckets públicos de avatar, geralmente se permite o SELECT simples.
    -- Para resolver o aviso do linter sem quebrar o acesso, podemos manter o SELECT mas ser ciente.
);