# Database Migration Guide - Apply All Migrations

## 🚨 IMPORTANT: You need to apply these migrations manually in Supabase Dashboard

The mobile number and profile data are not being saved because the database migrations haven't been applied yet.

## 📋 Step-by-Step Instructions

### 1. Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/zduueopxseywlccsoyxl/sql/new**

### 2. Apply Migrations in Order

You need to run these SQL files **one by one** in the exact order below:

---

#### Migration 1: `004_request_otp.sql`

**Purpose**: Adds the `request_otp()` function so the app can create OTP records

**File Location**: `backend/supabase/migrations/004_request_otp.sql`

**Steps**:
1. Open the file in your editor
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Wait for success message

---

#### Migration 2: `005_add_player_profile_fields.sql`

**Purpose**: Adds player profile fields to the users table

**File Location**: `backend/supabase/migrations/005_add_player_profile_fields.sql`

**Steps**:
1. Open the file in your editor
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Wait for success message

---

## ✅ Verify Migrations Were Applied

After running both migrations, verify in Supabase Dashboard:

### Check Tables

Go to: **Table Editor** → **users**

You should see these new columns:
- ✅ full_name
- ✅ age
- ✅ city
- ✅ gender
- ✅ handedness
- ✅ skill_level
- ✅ favorite_sports
- ✅ playing_style
- ✅ avatar_url
- ✅ profile_completed

### Check Functions

Go to: **Database** → **Functions**

You should see:
- ✅ request_otp
- ✅ verify_otp
- ✅ update_user_profile
- ✅ cleanup_expired_otps

---

## 🧪 Test the Complete Flow

After applying migrations:

### 1. Test OTP Login
```
1. Open your app
2. Enter phone: 9876543210
3. Click "Next"
4. Check Supabase → otp_verifications table
   → You should see a new OTP record
5. Enter OTP: 12345
6. Click verify
7. Check Supabase → users table
   → You should see a new user with your phone number
```

### 2. Test Profile Save
```
1. After login, fill out the profile form
2. Click "Continue"
3. Check Supabase → users table
   → The user record should now have:
     - full_name filled
     - age filled
     - city filled
     - gender filled
     - handedness filled
     - skill_level filled
     - favorite_sports array filled
     - playing_style filled
     - profile_completed = true
```

---

## 🔍 Troubleshooting

### If OTP doesn't save:
- Check that migration `004_request_otp.sql` was applied
- Check app console logs for errors
- Verify `request_otp` function exists in Supabase

### If user isn't created:
- Check that migration `002_create_users.sql` was applied earlier
- Check that `verify_otp` function exists
- Look at app console for error messages

### If profile doesn't save:
- Check that migration `005_add_player_profile_fields.sql` was applied
- Verify `update_user_profile` function exists
- Check app console logs

---

## 📝 Quick SQL Verification Queries

Run these in Supabase SQL Editor to check if everything is working:

### Check if functions exist:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('request_otp', 'verify_otp', 'update_user_profile');
```

### Check if columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
AND column_name IN ('full_name', 'age', 'city', 'gender', 'handedness', 'skill_level', 'favorite_sports', 'playing_style', 'profile_completed');
```

### Check OTP records:
```sql
SELECT * FROM otp_verifications ORDER BY created_at DESC LIMIT 5;
```

### Check user records:
```sql
SELECT phone_number, full_name, age, city, profile_completed 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## ✨ After Migrations Are Applied

Once you've applied both migrations:

1. ✅ OTP will be saved to database
2. ✅ User will be created on OTP verification
3. ✅ Phone number will be stored
4. ✅ Profile data will be saved
5. ✅ Everything will work end-to-end!

---

## 🆘 Need Help?

If you encounter any errors:
1. Copy the error message
2. Check which migration failed
3. Look at the SQL syntax in that file
4. Make sure you're running them in order
