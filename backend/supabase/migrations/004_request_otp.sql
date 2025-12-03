-- Create function to request OTP (for anon users)
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
  -- We don't check for existing active OTPs for simplicity in this dev phase,
  -- but in prod we might want to rate limit or invalidate old ones.
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
