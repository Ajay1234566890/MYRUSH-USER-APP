/**
 * Direct booking setup script using Supabase client
 * This creates only the booking table and function
 */

require('dotenv').config({ path: '../mobile/.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Creating Booking Table...\n');

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Booking table setup SQL
const bookingTableSQL = `
-- Create booking table (singular)
DROP TABLE IF EXISTS public.booking CASCADE;

CREATE TABLE public.booking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  venue_id UUID NOT NULL REFERENCES public.adminvenues(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  number_of_players INTEGER DEFAULT 2,
  team_name TEXT,
  special_requests TEXT,
  price_per_hour DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.booking
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create bookings" ON public.booking
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Function
CREATE OR REPLACE FUNCTION public.create_booking(
  p_booking_date DATE,
  p_duration_minutes INTEGER,
  p_number_of_players INTEGER,
  p_special_requests TEXT,
  p_start_time TIME,
  p_team_name TEXT,
  p_user_id UUID,
  p_venue_id UUID
) RETURNS JSONB SECURITY DEFINER AS $$
DECLARE
  v_total_amount DECIMAL(10,2);
  v_booking_id UUID;
BEGIN
  v_total_amount := 800.00 * (p_duration_minutes / 60.0);

  INSERT INTO public.booking (
    user_id, venue_id, booking_date, start_time, end_time,
    duration_minutes, number_of_players, team_name,
    special_requests, price_per_hour, total_amount
  ) VALUES (
    p_user_id, p_venue_id, p_booking_date, p_start_time,
    p_start_time + (p_duration_minutes || ' minutes')::INTERVAL,
    p_duration_minutes, p_number_of_players, p_team_name,
    p_special_requests, 800.00, v_total_amount
  ) RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('success', true, 'message', 'Booking saved!', 'booking_id', v_booking_id);
END; $$ LANGUAGE plpgsql;
`;

async function setupBookingSystem() {
    try {
        console.log('📋 Executing booking table creation...');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: bookingTableSQL
        });

        if (error) {
            console.log('❌ RPC method failed, trying alternative approach...');

            // Try alternative approach: table creation
            const { data: tableData, error: tableError } = await supabase.from('information_schema.tables').select('*').limit(1);
            if (tableError) {
                throw new Error(`Database not accessible: ${tableError.message}`);
            }

            // Since RPC exec_sql doesn't work, we'll provide the manual SQL
            console.log('📋 MANUAL EXECUTION REQUIRED:');
            console.log('='.repeat(50));
            console.log('Copy and paste this SQL into Supabase Dashboard → SQL Editor:');
            console.log('='.repeat(50));
            console.log(bookingTableSQL);
            console.log('='.repeat(50));

            return;
        }

        console.log('✅ Booking table created successfully!');
        console.log('🎯 Testing connection...');

        // Test the function
        const testResult = await supabase.rpc('create_booking', {
            p_booking_date: '2024-01-01',
            p_duration_minutes: 60,
            p_number_of_players: 2,
            p_special_requests: 'test',
            p_start_time: '10:00',
            p_team_name: 'test team',
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_venue_id: '00000000-0000-0000-0000-000000000000'
        });

        if (testResult.error) {
            if (testResult.error.code === 'PGRST202') {
                console.log('⚠️ Function created but schema cache needs refresh');
            } else {
                console.log('⚠️ Function test failed but table created:', testResult.error.message);
            }
        } else {
            console.log('✅ Booking function working!');
        }

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('\n📋 MANUAL EXECUTION REQUIRED: Will generate SQL below:');

        // Provide the SQL for manual execution
        console.log('='.repeat(60));
        console.log('Copy this SQL and run it in Supabase Dashboard → SQL Editor:');
        console.log('='.repeat(60));
        console.log(bookingTableSQL);
        console.log('='.repeat(60));
    }
}

setupBookingSystem().catch(console.error);
