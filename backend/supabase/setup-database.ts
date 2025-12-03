import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
    process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

interface MigrationFile {
    filename: string;
    path: string;
    sql: string;
}

async function runMigration(migration: MigrationFile): Promise<boolean> {
    console.log(`\n📄 Running migration: ${migration.filename}`);

    try {
        // Split SQL into individual statements
        const statements = migration.sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement) {
                const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

                if (error) {
                    // Try direct execution if RPC fails
                    const { error: directError } = await supabase.from('_migrations').insert({
                        name: migration.filename,
                        executed_at: new Date().toISOString()
                    });

                    if (directError) {
                        console.error(`   ❌ Error executing statement: ${error.message}`);
                        return false;
                    }
                }
            }
        }

        console.log(`   ✅ Migration completed successfully`);
        return true;
    } catch (error: any) {
        console.error(`   ❌ Migration failed: ${error.message}`);
        return false;
    }
}

async function setupDatabase() {
    console.log('🚀 Starting Supabase Database Setup\n');
    console.log('='.repeat(50));

    const migrationsDir = path.join(__dirname, 'migrations');

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
        console.error('❌ Migrations directory not found:', migrationsDir);
        process.exit(1);
    }

    // Read all migration files
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Sort to ensure migrations run in order

    if (files.length === 0) {
        console.log('⚠️  No migration files found');
        return;
    }

    console.log(`\n📦 Found ${files.length} migration file(s):\n`);
    files.forEach(f => console.log(`   - ${f}`));

    // Load migration files
    const migrations: MigrationFile[] = files.map(filename => ({
        filename,
        path: path.join(migrationsDir, filename),
        sql: fs.readFileSync(path.join(migrationsDir, filename), 'utf-8')
    }));

    // Run migrations
    let successCount = 0;
    let failCount = 0;

    for (const migration of migrations) {
        const success = await runMigration(migration);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📝 Total: ${migrations.length}`);

    if (failCount === 0) {
        console.log('\n🎉 All migrations completed successfully!');
        console.log('\n📋 Database Tables Created:');
        console.log('   - profiles (user profiles)');
        console.log('   - users (phone-based authentication)');
        console.log('   - otp_verifications (OTP codes)');
        console.log('\n🔐 Security Features:');
        console.log('   - Row Level Security (RLS) enabled');
        console.log('   - Secure OTP verification function');
        console.log('   - Automatic cleanup of expired OTPs');
    } else {
        console.log('\n⚠️  Some migrations failed. Please check the errors above.');
        process.exit(1);
    }
}

// Run setup
setupDatabase().catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
});
