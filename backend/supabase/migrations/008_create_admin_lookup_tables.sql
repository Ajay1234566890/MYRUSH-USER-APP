-- Create admin_cities table
CREATE TABLE IF NOT EXISTS public.admin_cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status BOOLEAN DEFAULT true, -- true = Active, false = Inactive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create admin_game_types table
CREATE TABLE IF NOT EXISTS public.admin_game_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status BOOLEAN DEFAULT true, -- true = Active, false = Inactive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.admin_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_game_types ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authenticated and anon)
CREATE POLICY "Allow public read access on admin_cities"
  ON public.admin_cities FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on admin_game_types"
  ON public.admin_game_types FOR SELECT
  USING (true);

-- Add city_id to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.admin_cities(id);

-- Insert seed data for cities
INSERT INTO public.admin_cities (name, status) VALUES
  ('Hyderabad', true),
  ('Bengaluru', true),
  ('Mumbai', true),
  ('Delhi', true),
  ('Chennai', true),
  ('Inactive City', false);

-- Insert seed data for game types
INSERT INTO public.admin_game_types (name, status) VALUES
  ('Pickleball', true),
  ('Badminton', true),
  ('Tennis', true),
  ('Football', true),
  ('Cricket', true),
  ('Basketball', true),
  ('Inactive Sport', false);

-- Update update_user_profile function to accept city_id
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_phone_number TEXT,
  p_full_name TEXT,
  p_age INTEGER DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_city_id UUID DEFAULT NULL, -- New parameter
  p_gender TEXT DEFAULT NULL,
  p_handedness TEXT DEFAULT 'Right-handed',
  p_skill_level TEXT DEFAULT NULL,
  p_favorite_sports TEXT[] DEFAULT NULL,
  p_playing_style TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_updated_user RECORD;
BEGIN
  -- Find user by phone number
  SELECT id INTO v_user_id
  FROM public.users
  WHERE phone_number = p_phone_number;

  -- If user not found, return error
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;

  -- Update user profile
  UPDATE public.users
  SET
    full_name = COALESCE(p_full_name, full_name),
    age = COALESCE(p_age, age),
    city = COALESCE(p_city, city),
    city_id = COALESCE(p_city_id, city_id), -- Update city_id
    gender = COALESCE(p_gender, gender),
    handedness = COALESCE(p_handedness, handedness),
    skill_level = COALESCE(p_skill_level, skill_level),
    favorite_sports = COALESCE(p_favorite_sports, favorite_sports),
    playing_style = COALESCE(p_playing_style, playing_style),
    profile_completed = true,
    updated_at = NOW()
  WHERE id = v_user_id
  RETURNING * INTO v_updated_user;

  -- Return success with updated user data
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Profile updated successfully',
    'user_id', v_user_id,
    'profile_completed', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
