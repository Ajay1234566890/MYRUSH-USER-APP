const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Tfz9FMhOx3AvkO1W@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('✅ Connected to MYRUSH database');
    console.log('\nTables found:');
    result.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTables();
