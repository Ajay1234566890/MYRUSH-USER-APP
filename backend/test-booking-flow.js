/**
 * Test the complete booking flow
 */

const { createClient } = require('@supabase/supabase-js');

// Using the credentials from mobile/src/api/supabase.ts
const SUPABASE_URL = 'https://zduueopxseywlccsoyxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkdXVlb3B4c2V5d2xjY3NveXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjE2NDUsImV4cCI6MjA3OTgzNzY0NX0.tHx6iByZRRj3wXBAM0-TWk372eQztZSr4ecCpV5_tig';

console.log('🧪 Testing Complete Booking Flow...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testBookingFlow() {
    try {
        console.log('1️⃣ Checking if users table exists...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, phone_number')
            .limit(1);
        
        if (usersError) {
            console.error('❌ Users table error:', usersError.message);
            return;
        }
        
        console.log('✅ Users table exists');
        if (users && users.length > 0) {
            console.log('   Sample user:', users[0]);
        }
        
        console.log('\n2️⃣ Checking if adminvenues table exists...');
        const { data: venues, error: venuesError } = await supabase
            .from('adminvenues')
            .select('id, court_name, prices')
            .limit(1);
        
        if (venuesError) {
            console.error('❌ Venues table error:', venuesError.message);
            return;
        }
        
        console.log('✅ Venues table exists');
        if (venues && venues.length > 0) {
            console.log('   Sample venue:', venues[0]);
        }
        
        console.log('\n3️⃣ Checking if booking table exists...');
        const { data: bookings, error: bookingsError } = await supabase
            .from('booking')
            .select('*')
            .limit(1);
        
        if (bookingsError) {
            console.error('❌ Booking table error:', bookingsError.message);
            return;
        }
        
        console.log('✅ Booking table exists');
        
        console.log('\n4️⃣ Testing create_booking function...');
        
        // Get a real user and venue for testing
        const { data: testUsers } = await supabase
            .from('users')
            .select('id')
            .limit(1);
        
        const { data: testVenues } = await supabase
            .from('adminvenues')
            .select('id')
            .limit(1);
        
        if (!testUsers || testUsers.length === 0) {
            console.log('⚠️ No users found in database. Create a user first.');
            return;
        }
        
        if (!testVenues || testVenues.length === 0) {
            console.log('⚠️ No venues found in database. Create a venue first.');
            return;
        }
        
        const testUserId = testUsers[0].id;
        const testVenueId = testVenues[0].id;
        
        console.log(`   Using User ID: ${testUserId}`);
        console.log(`   Using Venue ID: ${testVenueId}`);
        
        const { data, error } = await supabase.rpc('create_booking', {
            p_booking_date: '2024-12-15',
            p_duration_minutes: 60,
            p_number_of_players: 2,
            p_special_requests: 'Test booking from verification script',
            p_start_time: '14:00',
            p_team_name: 'Test Team',
            p_user_id: testUserId,
            p_venue_id: testVenueId
        });
        
        if (error) {
            console.error('❌ Function call failed:', error);
            
            if (error.code === 'PGRST202') {
                console.log('\n⚠️ Function signature mismatch!');
                console.log('The function might be missing the p_venue_id parameter.');
                console.log('Please run the SQL fix from the verify-booking-function.js script.');
            }
        } else {
            console.log('✅ Function works!');
            console.log('   Response:', data);
            
            if (data.success) {
                console.log('\n🎉 BOOKING CREATED SUCCESSFULLY!');
                console.log(`   Booking ID: ${data.booking_id}`);
                console.log(`   Total Amount: ₹${data.total_amount}`);
            } else {
                console.log('\n⚠️ Booking failed:', data.message);
            }
        }
        
        console.log('\n✅ All tests complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBookingFlow().catch(console.error);

