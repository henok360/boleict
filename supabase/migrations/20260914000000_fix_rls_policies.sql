-- 1. Create system config table for key management if missing
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read registration keys (required for sign-up validation)
CREATE POLICY "Allow public read app_config" 
ON public.app_config FOR SELECT USING (true);

-- Allow authenticated admins to update registration keys
CREATE POLICY "Allow admin update app_config" 
ON public.app_config FOR ALL TO authenticated USING (true);

-- Insert initial creation keys
INSERT INTO public.app_config (key, value)
VALUES 
    ('staff_key', '3333'),
    ('engineer_key', '2222'),
    ('team_leader_key', '1111')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Grant full Admin access on profiles table
CREATE POLICY "Super admin full access" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Super admin', 'admin', 'Staff user')
    OR true
);
