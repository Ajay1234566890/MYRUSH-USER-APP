import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://zduueopxseywlccsoyxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkdXVlb3B4c2V5d2xjY3NveXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjE2NDUsImV4cCI6MjA3OTgzNzY0NX0.tHx6iByZRRj3wXBAM0-TWk372eQztZSr4ecCpV5_tig';

// Create Supabase client with AsyncStorage for session persistence
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: false, // Disable session persistence for custom auth
    detectSessionInUrl: false,
  },
});

export default supabase;
