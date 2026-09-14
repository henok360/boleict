-- 1. Allow newly registered users to create their profile entry
CREATE POLICY "Enable insert for registration" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- 2. Allow authenticated users to view profiles
CREATE POLICY "Enable read access for authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. Allow users to update their own profile
CREATE POLICY "Enable update for users based on id" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 4. Give admin role full control over profiles
CREATE POLICY "Enable full management for admins" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'Staff user')
);
