import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client with service role key for backend operations
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create client with anon key for auth operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
export const supabaseAuth: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const connectDB = async (): Promise<void> => {
  try {
    // Test connection by making a simple query
    const { error } = await supabase.from('users').select('count').limit(1).maybeSingle();

    // If table doesn't exist, that's okay - we'll create it
    if (error && !error.message.includes('does not exist')) {
      console.warn(`⚠️ Supabase connection warning: ${error.message}`);
    }

    console.log(`✅ Supabase Connected: ${supabaseUrl}`);
  } catch (error) {
    console.error(`❌ Error connecting to Supabase: ${error}`);
    process.exit(1);
  }
};

export default connectDB;

