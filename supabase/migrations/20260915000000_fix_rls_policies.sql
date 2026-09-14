-- Allow newly registered users to create their profile entry
CREATE POLICY "Enable insert for registration" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users to view profiles
CREATE POLICY "Enable read access for authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);
