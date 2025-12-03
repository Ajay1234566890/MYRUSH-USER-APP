-- MyRush Database Setup Script
-- Run this SQL in your Supabase Dashboard SQL Editor

-- ================================================
-- Create user_profiles table for PlayerProfileScreen
-- ================================================

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
CREATE POLICY IF NOT EXISTS "user_profiles_no_direct_access" ON public.user_profiles
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

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- ================================================
-- Verification queries (optional)
-- ================================================

-- Check if table was created
-- SELECT table_name, column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'user_profiles'
-- ORDER BY ordinal_position;

-- Test insert (optional - remove this in production)
-- INSERT INTO public.user_profiles (
--   phone_number, 
--   full_name, 
--   age, 
--   city, 
--   gender, 
--   handedness, 
--   skill_level, 
--   sports, 
--   playing_style
-- ) VALUES (
--   '+1234567890', 
--   'Test User', 
--   25, 
--   'Test City', 
--   'Male', 
--   'Right-handed', 
--   'Intermediate', 
--   ARRAY['Pickleball', 'Tennis'], 
--   'All-court'
-- ) ON CONFLICT (phone_number) DO NOTHING;

-- Clean up test data
-- DELETE FROM public.user_profiles WHERE phone_number = '+1234567890';