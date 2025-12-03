const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../mobile/.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Listing all public tables...');
    const { data: tables, error: err } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (err) {
        console.log('Error listing tables:', err.message);
    } else {
        console.log('Tables:', tables.map(t => t.table_name));
    }

    console.log('Checking admin_cities table...');
    const { data, error } = await supabase.from('admin_cities').select('*');

    if (error) {
        console.log('Error accessing admin_cities:', error.message);
    } else {
        console.log('admin_cities data:', data);
    }

    console.log('Checking admin_game_types table...');
    const { data: data2, error: error2 } = await supabase.from('admin_game_types').select('*');

    if (error2) {
        console.log('Error accessing admin_game_types:', error2.message);
    } else {
        console.log('admin_game_types data:', data2);
    }
}

check();
