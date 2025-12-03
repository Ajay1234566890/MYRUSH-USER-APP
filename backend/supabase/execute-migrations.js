#!/usr/bin/env node

/**
 * Direct SQL Migration Executor for Supabase
 * Uses service role key to execute SQL directly
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment from mobile/.env (has service role key)
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

console.log('🚀 Executing Supabase Database Migrations\n');
console.log('='.repeat(60));
console.log(`\n📍 Project: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

/**
 * Execute SQL via Supabase REST API using service role
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
 * Execute migration file
 */
async function executeMigration(filename, filepath) {
    console.log(`\n📄 Executing: ${filename}`);

    try {
        const sql = fs.readFileSync(filepath, 'utf-8');
        console.log(`   📝 Executing ${sql.split('\n').length} lines of SQL...`);

        const result = await executeSQL(sql);

        if (result.success) {
            console.log(`   ✅ Success: ${filename}`);
            return { success: true };
        } else {
            console.log(`   ❌ Failed: ${filename}`);
            console.log(`   🔍 Error: ${result.error}`);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error(`   ❌ Error reading file: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Main execution function
 */
async function executeMigrations() {
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
    
    // Execute migrations in order
    let successCount = 0;
    let failCount = 0;

    for (const filename of files) {
        const filepath = path.join(migrationsDir, filename);
        const result = await executeMigration(filename, filepath);

        if (result.success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 EXECUTION SUMMARY:\n');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    
    if (failCount === 0) {
        console.log('\n🎉 All migrations executed successfully!');
        console.log('\n📱 Your MyRush app is ready to save player profiles!');
    } else {
        console.log('\n⚠️  Some migrations failed. Check the errors above.');
    }
    
    console.log('\n' + '='.repeat(60));
}

// Run migrations
executeMigrations().catch(error => {
    console.error('\n❌ Migration execution failed:', error);
    process.exit(1);
});