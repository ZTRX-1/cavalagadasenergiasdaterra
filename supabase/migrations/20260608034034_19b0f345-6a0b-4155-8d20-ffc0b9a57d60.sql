DROP POLICY IF EXISTS "Usuários atualizam o próprio perfil" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Ensure insert is also allowed if profile doesn't exist (though usually created via trigger)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" 
        ON public.profiles 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;