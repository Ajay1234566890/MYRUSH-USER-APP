# 🚀 Complete Setup & Testing Guide

## ✅ What You Need to Do

### Step 1: Apply the Quick Fix SQL

1. **Open Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/zduueopxseywlccsoyxl/sql/new
   ```

2. **Copy and paste this file**:
   ```
   backend/supabase/QUICK_FIX.sql
   ```

3. **Click "Run"**

This will create the `request_otp()` function with the correct OTP code (12345).

---

## 🧪 Test the Complete Flow

### Test 1: OTP Login & User Creation

1. **Open your mobile app**

2. **Enter phone number**: `9876543210`

3. **Click "Next"**
   - App calls `request_otp('+919876543210')`
   - OTP record is created in database with code '12345'

4. **Check Supabase** (optional):
   - Go to Table Editor → `otp_verifications`
   - You should see a new record with:
     - phone_number: +919876543210
     - otp_code: 12345
     - expires_at: 5 minutes from now

5. **Enter OTP**: `12345`

6. **App verifies OTP**:
   - Calls `verify_otp('+919876543210', '12345')`
   - Creates user in `users` table
   - Logs you in

7. **Check Supabase**:
   - Go to Table Editor → `users`
   - You should see a new user with:
     - phone_number: +919876543210
     - is_verified: true
     - last_login_at: current timestamp

---

### Test 2: Profile Setup & Save

1. **After login, you'll see PlayerProfileScreen**

2. **Fill out the form**:
   - Full Name: "John Doe"
   - Age: "25"
   - City: Select "Hyderabad"
   - Gender: "Male"
   - Handedness: "Right-handed"
   - Skill Level: "Intermediate"
   - Favorite Sports: Select "Pickleball" and "Tennis"
   - Playing Style: "All-court"

3. **Click "Continue"**
   - App calls `update_user_profile()` with all the data
   - Profile is saved to database

4. **Check Supabase**:
   - Go to Table Editor → `users`
   - Find your user record
   - You should see ALL fields filled:
     ```
     phone_number: +919876543210
     full_name: John Doe
     age: 25
     city: Hyderabad
     gender: Male
     handedness: Right-handed
     skill_level: Intermediate
     favorite_sports: ["Pickleball", "Tennis"]
     playing_style: All-court
     profile_completed: true
     ```

5. **App navigates to Home screen**

---

## 🔍 Verification SQL Queries

Run these in Supabase SQL Editor to verify everything is working:

### Check if functions exist:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('request_otp', 'verify_otp', 'update_user_profile');
```

**Expected result**: 3 rows showing all three functions

---

### Check OTP records:
```sql
SELECT 
  phone_number, 
  otp_code, 
  is_verified, 
  created_at,
  expires_at
FROM otp_verifications 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: You should see OTP records with code '12345'

---

### Check user data:
```sql
SELECT 
  phone_number,
  full_name,
  age,
  city,
  gender,
  handedness,
  skill_level,
  favorite_sports,
  playing_style,
  profile_completed,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: You should see your user with all profile data filled

---

## 🐛 Troubleshooting

### Issue: "Invalid or expired OTP"

**Cause**: No OTP record in database

**Solution**:
1. Check if `request_otp` function exists
2. Check app console logs for errors when clicking "Next"
3. Verify OTP record was created in `otp_verifications` table

---

### Issue: "Failed to fetch user profile"

**Cause**: User wasn't created after OTP verification

**Solution**:
1. Check if `verify_otp` function exists
2. Run this query to see if user was created:
   ```sql
   SELECT * FROM users WHERE phone_number = '+919876543210';
   ```
3. Check app console logs for errors

---

### Issue: "Failed to save profile"

**Cause**: `update_user_profile` function doesn't exist or profile fields missing

**Solution**:
1. Verify migration 005 was applied:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('full_name', 'age', 'city');
   ```
2. Check if `update_user_profile` function exists
3. Check app console logs for detailed error

---

## ✨ Summary

After running `QUICK_FIX.sql`, your complete flow will be:

1. ✅ User enters phone number
2. ✅ OTP (12345) is saved to database
3. ✅ User enters OTP
4. ✅ User is created in database with phone number
5. ✅ User fills out profile
6. ✅ Profile data is saved to database
7. ✅ User is navigated to Home screen

**Everything will be saved to Supabase!** 🎉

---

## 📝 Quick Test Commands

```sql
-- 1. Test request_otp
SELECT request_otp('+919876543210');

-- 2. Check OTP was created
SELECT * FROM otp_verifications WHERE phone_number = '+919876543210';

-- 3. Test verify_otp
SELECT * FROM verify_otp('+919876543210', '12345');

-- 4. Check user was created
SELECT * FROM users WHERE phone_number = '+919876543210';

-- 5. Test update_user_profile
SELECT update_user_profile(
  '+919876543210',
  'Test User',
  25,
  'Hyderabad',
  'Male',
  'Right-handed',
  'Intermediate',
  ARRAY['Pickleball', 'Tennis'],
  'All-court'
);

-- 6. Check profile was updated
SELECT * FROM users WHERE phone_number = '+919876543210';
```
