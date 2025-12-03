# Supabase Database Setup

## Overview

This directory contains SQL migrations and automated setup scripts for the MyRush application database.

## Database Schema

### Tables

1. **users** - Phone-based user authentication
   - `id` (UUID, Primary Key)
   - `phone_number` (TEXT, Unique)
   - `country_code` (TEXT, default: '+91')
   - `full_name` (TEXT)
   - `email` (TEXT)
   - `is_verified` (BOOLEAN)
   - `is_active` (BOOLEAN)
   - `created_at`, `updated_at`, `last_login_at` (TIMESTAMP)

2. **otp_verifications** - OTP code management
   - `id` (UUID, Primary Key)
   - `phone_number` (TEXT)
   - `otp_code` (TEXT)
   - `is_verified` (BOOLEAN)
   - `attempts` (INTEGER)
   - `max_attempts` (INTEGER, default: 3)
   - `expires_at` (TIMESTAMP)
   - `verified_at` (TIMESTAMP)
   - `created_at` (TIMESTAMP)

3. **profiles** - User profile information
   - `id` (UUID, references auth.users)
   - `email` (TEXT)
   - `first_name`, `last_name` (TEXT)
   - `avatar_url` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMP)

## Quick Setup

### Option 1: Automated Script (Recommended)

Run the automated setup script:

```bash
cd backend
npm run db:setup
```

This will display instructions and direct links to run migrations in Supabase Dashboard.

### Option 2: Manual Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/kdtkjedfuifgdhmuuvui/sql/new)
2. Open the SQL Editor
3. Copy and paste each migration file in order:
   - `001_create_profiles.sql`
   - `002_create_users.sql`
   - `003_create_otp_verifications.sql`
4. Click "Run" for each migration

### Option 3: Using Supabase CLI

If you have Supabase CLI installed:

```bash
npx supabase db push
```

## Migration Files

- **001_create_profiles.sql** - User profiles table with RLS policies
- **002_create_users.sql** - Phone-based authentication users table
- **003_create_otp_verifications.sql** - OTP verification system with functions

## Security Features

✅ **Row Level Security (RLS)** - All tables have RLS enabled
✅ **Secure Functions** - OTP verification with attempt limits
✅ **Auto Cleanup** - Expired OTPs are automatically cleaned up
✅ **Indexed Queries** - Optimized for fast lookups

## Database Functions

### `verify_otp(phone_number, otp_code)`

Verifies an OTP code and returns:
- `success` (BOOLEAN)
- `message` (TEXT)
- `user_id` (UUID)

**Usage:**
```sql
SELECT * FROM verify_otp('+919876543210', '123456');
```

### `cleanup_expired_otps()`

Removes OTP records older than 24 hours.

**Usage:**
```sql
SELECT cleanup_expired_otps();
```

## Environment Variables

Required in `.env` file:

```env
SUPABASE_URL=https://kdtkjedfuifgdhmuuvui.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

## NPM Scripts

```bash
# Run automated setup (shows instructions)
npm run db:setup

# Show migration files list
npm run db:help
```

## Troubleshooting

### Error: "relation already exists"

This means the table is already created. You can safely ignore this error or drop the table first:

```sql
DROP TABLE IF EXISTS table_name CASCADE;
```

### Error: "permission denied"

Make sure you're using the SQL Editor in Supabase Dashboard, which has admin privileges.

### Error: "function does not exist"

Run the migrations in order. Some functions depend on tables created in previous migrations.

## Next Steps

After setting up the database:

1. ✅ Test the OTP flow in your mobile app
2. ✅ Verify user creation works
3. ✅ Check RLS policies are working
4. ✅ Set up scheduled cleanup for expired OTPs

## Support

For issues or questions:
- Check Supabase logs in Dashboard
- Review migration files for syntax errors
- Ensure environment variables are set correctly
