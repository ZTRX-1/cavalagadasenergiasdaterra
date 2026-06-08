-- Remove broad SELECT policies that allowed any authenticated user to list all files
DROP POLICY IF EXISTS "Midia expedicao publica select" ON storage.objects;
DROP POLICY IF EXISTS "Avatars publicly readable select" ON storage.objects;

-- Instead, allow only internal users to list files in management buckets
CREATE POLICY "Internos leem midia expedicao" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'expedicao-midia' AND is_internal_user(auth.uid()));

-- For avatars, we don't need a SELECT policy for everyone since the bucket is public
-- and direct URL access works without it. We only allow users to manage their own.
-- (Existing policies for management are already there: "Users upload own avatar", etc.)
