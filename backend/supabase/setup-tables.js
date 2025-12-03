#!/usr/bin/env node

/**
 * Simple SQL Executor for Supabase
 * Creates the user_profiles table directly
 */

const https = require('https');
const fs = require('fs');

// Load environment from mobile/.env
const envPath = process.env.MOBILE_ENV_PATH || './mobile/.env';
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse environment variables
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
    }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project reference and management API URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const mgmtUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/sql`;

console.log('🚀 Creating Supabase Database Tables\n');
console.log('='.repeat(60));

/**
 * Execute SQL via Management API
 */
function executeSQL(query) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query });

        const options = {
            hostname: `${projectRef}.supabase.co`,
            port: 443,
            path: '/rest/v1/rpc/sql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, data: body });
                } else {
                    resolve({ success: false, error: body, statusCode: res.statusCode });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// SQL to create the user_profiles table (what the PlayerProfileScreen needs)
const userProfilesSQL = `
-- Create user_profiles table to store player profile data from the mobile app
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT,
  age INTEGER,
  city TEXT,
  gender TEXT,
  handedness TEXT,
  skill_level TEXT,
  sports TEXT[],
  playing_style TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security so only the backend (service role) can access this table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Deny access for non-service-role clients (service role bypasses RLS)
CREATE POLICY "user_profiles_no_direct_access" ON public.user_profiles
  USING (false)
  WITH CHECK (false);

-- Maintain updated_at column
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_profiles_updated_at();
`;

async function createUserProfilesTable() {
    console.log('📄 Creating user_profiles table...');
    
    try {
        const result = await executeSQL(userProfilesSQL);
        
        if (result.success) {
            console.log('   ✅ user_profiles table created successfully!');
            return true;
        } else {
            console.log('   ❌ Failed to create user_profiles table');
            console.log('   🔍 Error:', result.error);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        return false;
    }
}

// Alternative approach using direct POST to tables
function createTableDirect() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            query: 'CREATE TABLE IF NOT EXISTS public.user_profiles (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, phone_number TEXT UNIQUE NOT NULL, full_name TEXT, age INTEGER, city TEXT, gender TEXT, handedness TEXT, skill_level TEXT, sports TEXT[], playing_style TEXT, created_at TIMESTAMPTZ DEFAULT TIMEZONE(' + "'utc'" + ', NOW()), updated_at TIMESTAMPTZ DEFAULT TIMEZONE(' + "'utc'" + ', NOW()))'
        });

        const options = {
            hostname: `${projectRef}.supabase.co`,
            port: 443,
            path: '/rest/v1/rpc/create_table',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, data: body });
                } else {
                    resolve({ success: false, error: body, statusCode: res.statusCode });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Main execution
async function main() {
    console.log(`📍 Project: ${projectRef}`);
    console.log(`🔗 URL: ${SUPABASE_URL}\n`);

    const success = await createUserProfilesTable();
    
    if (success) {
        console.log('\n🎉 Database setup complete!');
        console.log('\n📱 Your PlayerProfileScreen is now ready to save data to Supabase!');
        console.log('   - The user_profiles table has been created');
        console.log('   - Row Level Security is configured');
        console.log('   - The mobile app can now save player profiles');
    } else {
        console.log('\n⚠️  Manual setup required.');
        console.log('   Please run the SQL manually in Supabase Dashboard:');
        console.log(`   ${SUPABASE_URL}/sql`);
    }
    
    console.log('\n' + '='.repeat(60));
}

main().catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
});