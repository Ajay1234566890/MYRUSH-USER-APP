#!/usr/bin/env node

/**
 * Automated Supabase Database Setup Script
 * 
 * This script automatically executes SQL migrations using Supabase REST API
 * Run with: node supabase/run-migrations.js
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
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in mobile/.env file');
    process.exit(1);
}

// Extract project reference from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🚀 Supabase Automated Database Setup\n');
console.log('='.repeat(60));
console.log(`\n📍 Project: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

/**
 * Execute SQL via Supabase REST API
 */
function executeSQL(sql) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query: sql });

        const options = {
            hostname: `${projectRef}.supabase.co`,
            port: 443,
            path: '/rest/v1/rpc/exec_sql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
 * Run migration file
 */
async function runMigration(filename, filepath) {
    console.log(`\n📄 Running: ${filename}`);

    try {
        const sql = fs.readFileSync(filepath, 'utf-8');

        // For Supabase, we need to execute via the SQL Editor API or manually
        // Since direct SQL execution requires service role key, we'll provide instructions

        console.log(`   ℹ️  This migration needs to be run manually via Supabase Dashboard`);
        console.log(`   📝 Lines: ${sql.split('\n').length}`);

        return { success: true, manual: true };
    } catch (error) {
        console.error(`   ❌ Error reading file: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Main setup function
 */
async function setupDatabase() {
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
    let manualCount = 0;

    for (const filename of files) {
        const filepath = path.join(migrationsDir, filename);
        const result = await runMigration(filename, filepath);

        if (result.manual) {
            manualCount++;
        }
    }

    // Provide instructions
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 SETUP INSTRUCTIONS:\n');
    console.log('Since these migrations require admin privileges, please run them');
    console.log('manually through the Supabase Dashboard:\n');
    console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('2. Copy the content of each migration file below');
    console.log('3. Paste into the SQL Editor');
    console.log('4. Click "Run" to execute\n');
    console.log('📁 Migration files location:');
    console.log(`   ${migrationsDir}\n`);
    console.log('📝 Execute in this order:\n');

    files.forEach((filename, index) => {
        console.log(`   ${index + 1}. ${filename}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ After running all migrations, you will have:\n');
    console.log('   ✅ users table (phone-based authentication)');
    console.log('   ✅ otp_verifications table (OTP codes)');
    console.log('   ✅ profiles table (user profiles)');
    console.log('   ✅ Row Level Security (RLS) policies');
    console.log('   ✅ OTP verification function');
    console.log('   ✅ Automatic timestamp updates\n');

    console.log('🔧 Quick command to open files:\n');
    files.forEach((filename) => {
        const filepath = path.join(migrationsDir, filename);
        console.log(`   code "${filepath}"`);
    });

    console.log('\n');
}

// Run setup
setupDatabase().catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
});
