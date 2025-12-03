-- ============================================
-- COMPLETE DATABASE SETUP - RUN THIS ONCE
-- ============================================
-- This file contains all necessary migrations in the correct order
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Create OTP Verifications Table & Functions
-- (From migration 003)
-- ============================================

-- Create OTP verification table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  country_code TEXT DEFAULT '+91' NOT NULL,
  otp_code TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON public.otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON public.otp_verifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_verifications(expires_at);

-- Enable Row Level Security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can manage OTP verifications" ON public.otp_verifications;

-- Create policy - only allow service role to access OTP table for security
CREATE POLICY "Service role can manage OTP verifications" 
  ON public.otp_verifications 
  FOR ALL
  TO service_role
  USING (true);

-- Also allow anon to insert (for request_otp) and select (for verify_otp)
DROP POLICY IF EXISTS "Anon can insert OTP" ON public.otp_verifications;
CREATE POLICY "Anon can insert OTP"
  ON public.otp_verifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can select own OTP" ON public.otp_verifications;
CREATE POLICY "Anon can select own OTP"
  ON public.otp_verifications
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anon can update OTP" ON public.otp_verifications;
CREATE POLICY "Anon can update OTP"
  ON public.otp_verifications
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Create function to clean up expired OTPs (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(
  p_phone_number TEXT,
  p_otp_code TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  user_id UUID
) AS $$
DECLARE
  v_otp_record RECORD;
  v_user_id UUID;
BEGIN
  -- Find the most recent non-expired OTP for this phone number
  SELECT * INTO v_otp_record
  FROM public.otp_verifications
  WHERE phone_number = p_phone_number
    AND is_verified = false
    AND expires_at > NOW()
    AND attempts < max_attempts
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if OTP exists
  IF v_otp_record IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or expired OTP'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if OTP matches
  IF v_otp_record.otp_code != p_otp_code THEN
    -- Increment attempts
    UPDATE public.otp_verifications
    SET attempts = attempts + 1
    WHERE id = v_otp_record.id;
    
    RETURN QUERY SELECT false, 'Invalid OTP code'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Mark OTP as verified
  UPDATE public.otp_verifications
  SET is_verified = true,
      verified_at = NOW()
  WHERE id = v_otp_record.id;

  -- Get or create user
  SELECT id INTO v_user_id
  FROM public.users
  WHERE phone_number = p_phone_number;

  IF v_user_id IS NULL THEN
    -- Create new user
    INSERT INTO public.users (phone_number, country_code, is_verified, last_login_at)
    VALUES (p_phone_number, v_otp_record.country_code, true, NOW())
    RETURNING id INTO v_user_id;
  ELSE
    -- Update existing user
    UPDATE public.users
    SET is_verified = true,
        last_login_at = NOW()
    WHERE id = v_user_id;
  END IF;

  RETURN QUERY SELECT true, 'OTP verified successfully'::TEXT, v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: Create Request OTP Function
-- (From migration 004)
-- ============================================

CREATE OR REPLACE FUNCTION public.request_otp(
  p_phone_number TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_otp_code TEXT := '12345'; -- Hardcoded for development
  v_expires_at TIMESTAMP WITH TIME ZONE := NOW() + INTERVAL '5 minutes';
  v_id UUID;
BEGIN
  -- Insert into otp_verifications
  INSERT INTO public.otp_verifications (phone_number, otp_code, expires_at)
  VALUES (p_phone_number, v_otp_code, v_expires_at)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'OTP sent successfully',
    'verification_id', v_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Add Player Profile Fields
-- (From migration 005)
-- ============================================

-- Add new columns to users table for player profile
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS handedness TEXT DEFAULT 'Right-handed',
ADD COLUMN IF NOT EXISTS skill_level TEXT,
ADD COLUMN IF NOT EXISTS favorite_sports TEXT[],
ADD COLUMN IF NOT EXISTS playing_style TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Drop existing constraints if they exist
DO $$ 
BEGIN
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_age;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_gender;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_handedness;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_skill_level;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_playing_style;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add check constraints
ALTER TABLE public.users
ADD CONSTRAINT check_age CHECK (age IS NULL OR (age >= 10 AND age <= 100)),
ADD CONSTRAINT check_gender CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')),
ADD CONSTRAINT check_handedness CHECK (handedness IN ('Right-handed', 'Left-handed', 'Ambidextrous')),
ADD CONSTRAINT check_skill_level CHECK (skill_level IS NULL OR skill_level IN ('Beginner', 'Intermediate', 'Advanced', 'Pro')),
ADD CONSTRAINT check_playing_style CHECK (playing_style IS NULL OR playing_style IN ('Dinker', 'Banger', 'All-court', 'Net Player', 'Baseline'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_city ON public.users(city);
CREATE INDEX IF NOT EXISTS idx_users_skill_level ON public.users(skill_level);
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

-- ============================================
-- STEP 4: Grant Permissions
-- ============================================

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.request_otp(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otps() TO anon, authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- You can uncomment and run these to test:
-- SELECT request_otp('+919876543210');
-- SELECT * FROM otp_verifications WHERE phone_number = '+919876543210';
-- SELECT * FROM verify_otp('+919876543210', '12345');
-- SELECT * FROM users WHERE phone_number = '+919876543210';
