#!/usr/bin/env node

/**
 * Create user_profiles table using Supabase REST API
 */

const https = require('https');
const fs = require('fs');

// Load environment
const envContent = fs.readFileSync('../../mobile/.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🚀 Creating Database Tables via REST API\n');
console.log('='.repeat(60));

/**
 * Make REST API request to create table schema
 */
function createTableViaAPI() {
    return new Promise((resolve, reject) => {
        const sql = `
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
            
            ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "user_profiles_no_direct_access" 
            ON public.user_profiles USING (false) WITH CHECK (false);
            
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

        // Use SQL Editor API endpoint
        const data = JSON.stringify({ sql });

        const options = {
            hostname: `${projectRef}.supabase.co`,
            port: 443,
            path: '/sql',
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

/**
 * Test table creation by inserting a record
 */
function testTable() {
    return new Promise((resolve, reject) => {
        const testData = {
            phone_number: '+1234567890',
            full_name: 'Test User',
            age: 25,
            city: 'Test City',
            gender: 'Male',
            handedness: 'Right-handed',
            skill_level: 'Intermediate',
            sports: ['Pickleball', 'Tennis'],
            playing_style: 'All-court'
        };

        const data = JSON.stringify(testData);

        const options = {
            hostname: `${projectRef}.supabase.co`,
            port: 443,
            path: '/rest/v1/user_profiles',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Prefer': 'return=representation',
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

/**
 * Clean up test record
 */
function cleanupTest() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: `${projectRef}.supabase.co`,
            port: 443,
            path: '/rest/v1/user_profiles?phone_number=eq.%2B1234567890',
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                resolve({ success: true, data: body });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Main execution
async function main() {
    console.log(`📍 Project: ${projectRef}`);
    console.log(`🔗 URL: ${SUPABASE_URL}\n`);

    try {
        console.log('📄 Creating user_profiles table...');
        const result = await createTableViaAPI();

        if (result.success) {
            console.log('   ✅ Table created successfully!');
            
            // Wait a moment for table to be available
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('🧪 Testing table with sample data...');
            const testResult = await testTable();
            
            if (testResult.success) {
                console.log('   ✅ Test successful! Data saved to user_profiles table');
                
                // Clean up
                await cleanupTest();
                console.log('   🧹 Test data cleaned up');
                
                console.log('\n🎉 Database setup complete!');
                console.log('\n📱 Your PlayerProfileScreen is now ready to save data to Supabase!');
                console.log('\n✅ What was created:');
                console.log('   - user_profiles table with all required fields');
                console.log('   - Row Level Security policies');
                console.log('   - Automatic timestamp updates');
                console.log('   - Full CRUD operations via API');
                
            } else {
                console.log('   ❌ Test failed:', testResult.error);
            }
            
        } else {
            console.log('   ❌ Table creation failed:', result.error);
            console.log('\n📋 Manual setup required:');
            console.log(`   1. Go to: ${SUPABASE_URL}/sql`);
            console.log('   2. Copy and paste this SQL:');
            console.log('\n   CREATE TABLE IF NOT EXISTS public.user_profiles (');
            console.log('       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
            console.log('       phone_number TEXT UNIQUE NOT NULL,');
            console.log('       full_name TEXT,');
            console.log('       age INTEGER,');
            console.log('       city TEXT,');
            console.log('       gender TEXT,');
            console.log('       handedness TEXT,');
            console.log('       skill_level TEXT,');
            console.log('       sports TEXT[],');
            console.log('       playing_style TEXT,');
            console.log('       created_at TIMESTAMPTZ DEFAULT TIMEZONE(\'utc\', NOW()),');
            console.log('       updated_at TIMESTAMPTZ DEFAULT TIMEZONE(\'utc\', NOW())');
            console.log('   );');
            console.log('   ');
            console.log('   ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;');
            console.log('   ');
            console.log('   CREATE POLICY "user_profiles_no_direct_access"');
            console.log('   ON public.user_profiles USING (false) WITH CHECK (false);');
        }

    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
}

main().catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
});