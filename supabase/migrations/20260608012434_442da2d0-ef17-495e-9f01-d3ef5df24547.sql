-- Update storage policies to prevent anonymous listing
-- Direct public access via URL is not affected if the bucket is public

DROP POLICY IF EXISTS "Midia expedicao publica" ON storage.objects;
CREATE POLICY "Midia expedicao publica select" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'expedicao-midia');

-- Ensure public read access is still possible if needed via RLS (though public buckets handle this)
-- But the linter warning specifically targets broad SELECT to 'public' or 'anon'

DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
CREATE POLICY "Avatars publicly readable select" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'avatars');
