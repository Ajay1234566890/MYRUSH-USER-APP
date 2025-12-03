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

-- Create policy - only allow service role to access OTP table for security
CREATE POLICY "Service role can manage OTP verifications" 
  ON public.otp_verifications 
  USING (auth.role() = 'service_role');

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

-- Add comment to table
COMMENT ON TABLE public.otp_verifications IS 'Stores OTP codes for phone number verification';
