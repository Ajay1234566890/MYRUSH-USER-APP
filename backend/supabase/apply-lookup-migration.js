const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment
const envContent = fs.readFileSync(path.join(__dirname, '../../mobile/.env'), 'utf-8');
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

console.log('🚀 Applying Migration 008 via REST API\n');

function executeSQL(sql) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ sql });

        const options = {
            hostname: `${projectRef}.supabase.co`,
            port: 443,
            path: '/sql', // Trying the endpoint used in create-tables.js
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
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, data: body });
                } else {
                    resolve({ success: false, error: body, statusCode: res.statusCode });
                }
            });
        });

        req.on('error', (error) => reject(error));
        req.write(data);
        req.end();
    });
}

async function main() {
    try {
        const migrationPath = path.join(__dirname, 'migrations', '008_create_admin_lookup_tables.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📄 Executing SQL...');
        const result = await executeSQL(sql);

        if (result.success) {
            console.log('✅ Migration applied successfully!');
        } else {
            console.error('❌ Migration failed:', result.error);
            // Fallback: Try to use the RPC exec_sql if it exists (some projects have it)
            console.log('🔄 Trying fallback method...');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();
