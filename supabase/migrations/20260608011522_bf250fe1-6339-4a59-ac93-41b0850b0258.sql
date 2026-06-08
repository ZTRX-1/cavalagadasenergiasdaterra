-- 3. Tighten RLS Policy on page_views (Satisfy linter)
DROP POLICY IF EXISTS "Apenas usuários autenticados inserem page_views" ON public.page_views;
CREATE POLICY "Apenas usuários autenticados inserem page_views" 
ON public.page_views FOR INSERT 
TO authenticated 
WITH CHECK (path IS NOT NULL);
