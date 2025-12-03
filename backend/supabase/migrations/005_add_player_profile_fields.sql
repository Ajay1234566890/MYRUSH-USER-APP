-- Migration: Add player profile fields to users table
-- This migration extends the users table to store player profile information

-- Add new columns to users table for player profile
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS handedness TEXT DEFAULT 'Right-handed',
ADD COLUMN IF NOT EXISTS skill_level TEXT,
ADD COLUMN IF NOT EXISTS favorite_sports TEXT[], -- Array of sports
ADD COLUMN IF NOT EXISTS playing_style TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Add check constraints
ALTER TABLE public.users
ADD CONSTRAINT check_age CHECK (age IS NULL OR (age >= 10 AND age <= 100)),
ADD CONSTRAINT check_gender CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')),
ADD CONSTRAINT check_handedness CHECK (handedness IN ('Right-handed', 'Left-handed', 'Ambidextrous')),
ADD CONSTRAINT check_skill_level CHECK (skill_level IS NULL OR skill_level IN ('Beginner', 'Intermediate', 'Advanced', 'Pro')),
ADD CONSTRAINT check_playing_style CHECK (playing_style IS NULL OR playing_style IN ('Dinker', 'Banger', 'All-court', 'Net Player', 'Baseline'));

-- Create index on city for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_city ON public.users(city);

-- Create index on skill_level for matchmaking
CREATE INDEX IF NOT EXISTS idx_users_skill_level ON public.users(skill_level);

-- Create index on profile_completed for filtering
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON public.users(profile_completed);

-- Function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_phone_number TEXT,
  p_full_name TEXT,
  p_age INTEGER DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
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

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.update_user_profile(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_profile(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT) TO authenticated;

-- Add comment to table
COMMENT ON TABLE public.users IS 'Users table with phone-based authentication and player profile information';
COMMENT ON COLUMN public.users.full_name IS 'User full name';
COMMENT ON COLUMN public.users.age IS 'User age (10-100)';
COMMENT ON COLUMN public.users.city IS 'User city or area';
COMMENT ON COLUMN public.users.gender IS 'User gender identity';
COMMENT ON COLUMN public.users.handedness IS 'Player handedness for sports';
COMMENT ON COLUMN public.users.skill_level IS 'Player skill level';
COMMENT ON COLUMN public.users.favorite_sports IS 'Array of favorite sports';
COMMENT ON COLUMN public.users.playing_style IS 'Player playing style';
COMMENT ON COLUMN public.users.profile_completed IS 'Whether user has completed profile setup';
