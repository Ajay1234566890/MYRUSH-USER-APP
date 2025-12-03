/**
 * Test the get_user_bookings function
 */

const { createClient } = require('@supabase/supabase-js');

// Using the credentials from mobile/src/api/supabase.ts
const SUPABASE_URL = 'https://zduueopxseywlccsoyxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkdXVlb3B4c2V5d2xjY3NveXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjE2NDUsImV4cCI6MjA3OTgzNzY0NX0.tHx6iByZRRj3wXBAM0-TWk372eQztZSr4ecCpV5_tig';

console.log('🧪 Testing Get User Bookings...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testGetBookings() {
    try {
        console.log('1️⃣ Getting a test user...');
        const { data: users } = await supabase
            .from('users')
            .select('id, phone_number')
            .limit(1);
        
        if (!users || users.length === 0) {
            console.log('❌ No users found in database.');
            return;
        }
        
        const testUserId = users[0].id;
        console.log(`✅ Using User ID: ${testUserId}`);
        console.log(`   Phone: ${users[0].phone_number}\n`);
        
        console.log('2️⃣ Fetching all bookings for this user...');
        const { data: allBookings, error: allError } = await supabase
            .rpc('get_user_bookings', {
                p_user_id: testUserId,
                p_status_filter: null
            });
        
        if (allError) {
            console.error('❌ Error fetching bookings:', allError);
            return;
        }
        
        console.log(`✅ Found ${allBookings?.length || 0} total bookings\n`);
        
        if (allBookings && allBookings.length > 0) {
            console.log('📋 Booking Details:\n');
            allBookings.forEach((booking, index) => {
                console.log(`Booking ${index + 1}:`);
                console.log(`  ID: ${booking.id}`);
                console.log(`  Venue: ${booking.venue_name}`);
                console.log(`  Location: ${booking.venue_location}`);
                console.log(`  Date: ${booking.booking_date}`);
                console.log(`  Time: ${booking.start_time} - ${booking.end_time}`);
                console.log(`  Players: ${booking.number_of_players}`);
                console.log(`  Team: ${booking.team_name || 'N/A'}`);
                console.log(`  Amount: ₹${booking.total_amount}`);
                console.log(`  Status: ${booking.status}`);
                console.log(`  Created: ${booking.created_at}`);
                console.log('');
            });
        } else {
            console.log('ℹ️ No bookings found for this user.');
            console.log('   Create a booking first using the mobile app or test script.\n');
        }
        
        console.log('3️⃣ Testing status filters...\n');
        
        // Test confirmed bookings
        const { data: confirmedBookings } = await supabase
            .rpc('get_user_bookings', {
                p_user_id: testUserId,
                p_status_filter: 'confirmed'
            });
        console.log(`   Confirmed bookings: ${confirmedBookings?.length || 0}`);
        
        // Test pending bookings
        const { data: pendingBookings } = await supabase
            .rpc('get_user_bookings', {
                p_user_id: testUserId,
                p_status_filter: 'pending'
            });
        console.log(`   Pending bookings: ${pendingBookings?.length || 0}`);
        
        // Test completed bookings
        const { data: completedBookings } = await supabase
            .rpc('get_user_bookings', {
                p_user_id: testUserId,
                p_status_filter: 'completed'
            });
        console.log(`   Completed bookings: ${completedBookings?.length || 0}`);
        
        // Test cancelled bookings
        const { data: cancelledBookings } = await supabase
            .rpc('get_user_bookings', {
                p_user_id: testUserId,
                p_status_filter: 'cancelled'
            });
        console.log(`   Cancelled bookings: ${cancelledBookings?.length || 0}`);
        
        console.log('\n✅ All tests complete!');
        console.log('\n💡 The bookings should now appear in the mobile app\'s "Bookings" tab!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testGetBookings().catch(console.error);

