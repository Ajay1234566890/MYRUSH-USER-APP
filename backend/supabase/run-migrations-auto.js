#!/usr/bin/env node

/**
 * Automated Supabase Migration Runner using Service Role Key
 * 
 * This script executes SQL migrations directly using Supabase REST API
 * with the service role key for admin privileges.
 * 
 * Run with: npm run db:migrate
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment from mobile/.env since backend/.env is gitignored
const envPath = path.join(__dirname, '../../mobile/.env');
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in mobile/.env file');
    process.exit(1);
}

// Extract project reference from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🚀 Supabase Migration Runner\n');
console.log('='.repeat(60));
console.log(`\n📍 Project: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

/**
 * Execute SQL via Supabase Management API
 */
function executeSQLDirect(sql) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query: sql });

        const options = {
            hostname: `${projectRef}.supabase.co`,
            port: 443,
            path: '/rest/v1/rpc/exec_sql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Length': data.length,
                'Prefer': 'return=representation'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, data: body, statusCode: res.statusCode });
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
 * Run migration file
 */
async function runMigration(filename, filepath) {
    console.log(`\n📄 Running: ${filename}`);

    try {
        const sql = fs.readFileSync(filepath, 'utf-8');

        // Try to execute the SQL
        const result = await executeSQLDirect(sql);

        if (result.success) {
            console.log(`   ✅ Migration completed successfully`);
            return { success: true };
        } else {
            console.log(`   ⚠️  Migration may need manual execution`);
            console.log(`   Status: ${result.statusCode}`);
            return { success: false, needsManual: true };
        }
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Main setup function
 */
async function runMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
        console.error('❌ Migrations directory not found:', migrationsDir);
        process.exit(1);
    }

    // Read all migration files
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        console.log('⚠️  No migration files found');
        return;
    }

    console.log(`📦 Found ${files.length} migration file(s):\n`);

    // Process migrations
    let successCount = 0;
    let manualCount = 0;

    for (const filename of files) {
        const filepath = path.join(migrationsDir, filename);
        const result = await runMigration(filename, filepath);

        if (result.success) {
            successCount++;
        } else if (result.needsManual) {
            manualCount++;
        }
    }

    // Provide instructions
    console.log('\n' + '='.repeat(60));

    if (manualCount > 0) {
        console.log('\n📋 MANUAL MIGRATION REQUIRED:\n');
        console.log('Some migrations need to be run manually through the Supabase Dashboard:\n');
        console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
        console.log('2. Copy the content of each migration file');
        console.log('3. Paste into the SQL Editor');
        console.log('4. Click "Run" to execute\n');
        console.log('📁 Migration files location:');
        console.log(`   ${migrationsDir}\n`);
        console.log('📝 Execute in this order:\n');

        files.forEach((filename, index) => {
            console.log(`   ${index + 1}. ${filename}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ After running all migrations, you will have:\n');
    console.log('   ✅ users table (phone-based authentication)');
    console.log('   ✅ otp_verifications table (OTP codes)');
    console.log('   ✅ profiles table (user profiles)');
    console.log('   ✅ player_profile fields (sports preferences)');
    console.log('   ✅ Row Level Security (RLS) policies');
    console.log('   ✅ OTP verification function');
    console.log('   ✅ Profile update function');
    console.log('   ✅ Automatic timestamp updates\n');

    console.log('');
}

// Run migrations
runMigrations().catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
});
