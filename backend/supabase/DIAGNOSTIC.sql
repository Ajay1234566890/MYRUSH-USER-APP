-- DIAGNOSTIC QUERIES - Run these to check what's happening

-- 1. Check if OTP records are being created
SELECT * FROM otp_verifications 
WHERE phone_number = '+919640351007'
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if users are being created
SELECT * FROM users 
WHERE phone_number = '+919640351007';

-- 3. Test the verify_otp function manually
SELECT * FROM verify_otp('+919640351007', '12345');

-- 4. Check if the users table exists and has the right structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. Check RLS policies on users table
SELECT * FROM pg_policies WHERE tablename = 'users';

-- If the user isn't being created, run this to create one manually:
INSERT INTO public.users (phone_number, country_code, is_verified, last_login_at)
VALUES ('+919640351007', '+91', true, NOW())
ON CONFLICT (phone_number) DO UPDATE
SET is_verified = true, last_login_at = NOW()
RETURNING *;
