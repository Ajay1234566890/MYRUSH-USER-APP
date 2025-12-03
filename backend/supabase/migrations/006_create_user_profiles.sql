-- Create user_profiles table to store player profile data from the mobile app
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT,
  age INTEGER,
  city TEXT,
  gender TEXT,
  handedness TEXT,
  skill_level TEXT,
  sports TEXT[],
  playing_style TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security so only the backend (service role) can access this table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Deny access for non-service-role clients (service role bypasses RLS)
CREATE POLICY "user_profiles_no_direct_access" ON public.user_profiles
  USING (false)
  WITH CHECK (false);

-- Maintain updated_at column
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_profiles_updated_at();

