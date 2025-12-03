#!/usr/bin/env node

/**
 * Database Setup using Supabase JavaScript Client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment from mobile/.env
const envPath = process.env.MOBILE_ENV_PATH || '../../mobile/.env';
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

console.log('🚀 Setting up MyRush Database Tables\n');
console.log('='.repeat(60));
console.log(`📍 Project: ${SUPABASE_URL.split('//')[1].split('.')[0]}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Create user_profiles table using raw SQL
 */
async function createUserProfilesTable() {
    console.log('📄 Creating user_profiles table...');
    
    const createTableSQL = `
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
    `;

    try {
        // Use rpc to execute SQL (this should work with service role)
        const { data, error } = await supabase.rpc('exec_sql', {
            query: createTableSQL
        });

        if (error) {
            console.log('   ❌ RPC approach failed:', error.message);
            return false;
        }

        console.log('   ✅ user_profiles table created!');
        return true;
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        return false;
    }
}

/**
 * Create RLS policies
 */
async function createRLSPolicies() {
    console.log('🔒 Setting up Row Level Security...');
    
    const rlsSQL = `
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "user_profiles_no_direct_access" 
        ON public.user_profiles USING (false) WITH CHECK (false);
    `;

    try {
        const { error } = await supabase.rpc('exec_sql', {
            query: rlsSQL
        });

        if (error) {
            console.log('   ❌ RLS setup failed:', error.message);
            return false;
        }

        console.log('   ✅ RLS policies created!');
        return true;
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        return false;
    }
}

/**
 * Create update trigger function
 */
async function createUpdateTrigger() {
    console.log('⚡ Creating update trigger...');
    
    const triggerSQL = `
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

    try {
        const { error } = await supabase.rpc('exec_sql', {
            query: triggerSQL
        });

        if (error) {
            console.log('   ❌ Trigger creation failed:', error.message);
            return false;
        }

        console.log('   ✅ Update trigger created!');
        return true;
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        return false;
    }
}

/**
 * Test the setup by inserting a test record
 */
async function testSetup() {
    console.log('🧪 Testing database setup...');
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert({
                phone_number: '+1234567890',
                full_name: 'Test User',
                age: 25,
                city: 'Test City'
            })
            .select()
            .single();

        if (error) {
            console.log('   ❌ Test insert failed:', error.message);
            return false;
        }

        console.log('   ✅ Test successful! Record created:', data.id);
        
        // Clean up test record
        await supabase
            .from('user_profiles')
            .delete()
            .eq('phone_number', '+1234567890');
            
        console.log('   🧹 Test record cleaned up');
        return true;
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        return false;
    }
}

/**
 * Check if tables exist
 */
async function checkTables() {
    console.log('🔍 Checking existing tables...');
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1);

        if (error && error.code === 'PGRST116') {
            console.log('   ℹ️  user_profiles table does not exist yet');
            return false;
        } else if (error) {
            console.log('   ❌ Error checking tables:', error.message);
            return false;
        }

        console.log('   ✅ user_profiles table exists!');
        return true;
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        return false;
    }
}

// Main execution
async function main() {
    try {
        // Check if table already exists
        const tableExists = await checkTables();
        
        if (tableExists) {
            console.log('\n✅ Database is already set up!');
            console.log('\n📱 Your PlayerProfileScreen can now save data to Supabase!');
            console.log('\n' + '='.repeat(60));
            return;
        }

        console.log('\n🔨 Setting up database tables...\n');
        
        // Create table and policies
        const tableCreated = await createUserProfilesTable();
        
        if (!tableCreated) {
            console.log('\n❌ Failed to create user_profiles table');
            console.log('   Please run this SQL manually in Supabase Dashboard:');
            console.log(`   ${SUPABASE_URL}/sql`);
            return;
        }

        const rlsCreated = await createRLSPolicies();
        const triggerCreated = await createUpdateTrigger();
        const testPassed = await testSetup();

        console.log('\n' + '='.repeat(60));
        
        if (tableCreated && rlsCreated && triggerCreated && testPassed) {
            console.log('\n🎉 Database setup complete!');
            console.log('\n📱 Your PlayerProfileScreen is now ready to save data to Supabase!');
            console.log('\n✅ What was created:');
            console.log('   - user_profiles table with all required fields');
            console.log('   - Row Level Security policies');
            console.log('   - Automatic timestamp updates');
            console.log('   - Database connectivity test passed');
        } else {
            console.log('\n⚠️  Partial setup completed');
            console.log('   Please check the errors above');
        }
        
        console.log('\n' + '='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

main();