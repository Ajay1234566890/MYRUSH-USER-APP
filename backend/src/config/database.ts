import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in environment variables');
  process.exit(1);
}

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase PostgreSQL connections
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Helper function to get a client from the pool
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// Helper function to execute a query
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

const connectDB = async (): Promise<void> => {
  try {
    // Test connection by making a simple query
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    console.log(`✅ PostgreSQL Connected Successfully`);
    console.log(`   Database: MYRUSH`);
    console.log(`   Server Time: ${result.rows[0].now}`);
  } catch (error) {
    console.error(`❌ Error connecting to PostgreSQL: ${error}`);
    process.exit(1);
  }
};

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

export default connectDB;

