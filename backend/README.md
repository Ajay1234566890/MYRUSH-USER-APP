# MyRush Backend (Express API)

## ⚠️ Current Status: NOT IN USE

This Express backend is **currently not being used** by the MyRush mobile app.

### Why It Exists

This backend was initially set up for potential future use, but the mobile app currently:
- Uses **Supabase directly** for all database operations
- Uses **Supabase RPC functions** for OTP authentication
- Uses **Direct Supabase queries** for venues and profiles

### Mobile App API Calls

The mobile app (`/mobile`) currently uses:

1. **OTP Authentication**
   - `supabase.rpc('request_otp', { p_phone_number })`
   - `supabase.rpc('verify_otp', { p_phone_number, p_otp_code })`

2. **User Profiles**
   - `supabase.rpc('update_user_profile', { ... })`
   - Direct queries to `users` table

3. **Venues**
   - Direct queries to `adminvenues` table

### What This Backend Provides

This Express backend has the following routes (NOT currently used):

- `/api/v1/health` - Health check
- `/api/v1/auth/login` - Email/password login (NOT used - app uses OTP)
- `/api/v1/auth/register` - Email/password registration (NOT used)
- `/api/v1/auth/profile` - Get user profile (NOT used)
- `/api/v1/profile` - Save user profile (NOT used - app uses Supabase RPC)

### When Would You Need This?

You might want to deploy this backend if you need to:

1. **Add custom business logic** that can't be done in Supabase RPC functions
2. **Integrate with third-party APIs** (payments, SMS, etc.)
3. **Add complex authentication** beyond OTP
4. **Implement caching** or complex data transformations
5. **Add admin APIs** for a web dashboard

### How to Deploy (When Needed)

See the root-level `DEPLOYMENT_GUIDE.md` for instructions on deploying to:
- Render.com (recommended, free tier)
- Railway.app
- Fly.io

### Running Locally (For Development)

If you want to test or develop this backend:

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and fill in values

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### Environment Variables Needed

```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
JWT_SECRET=<random-secret>
API_VERSION=v1
API_PREFIX=/api
CORS_ORIGIN=*
```

### Current Architecture

```
MyRush App Architecture:

Mobile App (React Native/Expo)
    ↓
    └─→ Supabase Cloud ✅
        ├─ Database (PostgreSQL)
        ├─ Auth (RPC Functions)
        ├─ Storage
        └─ RPC Functions
            ├─ request_otp
            ├─ verify_otp
            └─ update_user_profile

Express Backend (localhost:5000)
    → NOT USED ❌
```

### Migration to This Backend (If Needed)

If you decide to use this backend in the future:

1. **Update mobile app API client:**
   - Uncomment `API_BASE_URL` in `mobile/.env`
   - Update API calls to use Express endpoints instead of Supabase direct

2. **Deploy backend:**
   - Follow `DEPLOYMENT_GUIDE.md`
   - Get public URL (e.g., `https://myrush-api.onrender.com`)

3. **Update mobile `.env`:**
   ```env
   API_BASE_URL=https://myrush-api.onrender.com
   ```

4. **Rebuild mobile app:**
   ```bash
   cd mobile
   npx expo build:android
   ```

---

**For now, you can safely ignore this backend directory.** ✅

Your mobile app works perfectly with just Supabase! 🚀
