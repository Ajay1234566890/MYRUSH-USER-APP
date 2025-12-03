-- Quick Fix: Apply request_otp function with correct OTP code (12345)
-- Run this in Supabase SQL Editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.request_otp(TEXT);

-- Create function to request OTP with hardcoded OTP = 12345
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

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.request_otp(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.request_otp(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_otp(TEXT, TEXT) TO authenticated;

-- Test: You can run this to verify it works
-- SELECT request_otp('+919876543210');
