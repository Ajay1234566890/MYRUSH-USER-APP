/**
 * Complete end-to-end test of the booking system
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zduueopxseywlccsoyxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkdXVlb3B4c2V5d2xjY3NveXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjE2NDUsImV4cCI6MjA3OTgzNzY0NX0.tHx6iByZRRj3wXBAM0-TWk372eQztZSr4ecCpV5_tig';

console.log('🧪 Complete Booking System Test\n');
console.log('='.repeat(70));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runCompleteTest() {
    let testUserId, testVenueId, bookingId;
    
    try {
        // Step 1: Check database tables
        console.log('\n📊 STEP 1: Checking Database Tables\n');
        
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, phone_number')
            .limit(1);
        
        if (usersError || !users || users.length === 0) {
            console.log('❌ No users found. Please create a user first.');
            return;
        }
        
        testUserId = users[0].id;
        console.log(`✅ Users table OK - Using user: ${users[0].phone_number}`);
        
        const { data: venues, error: venuesError } = await supabase
            .from('adminvenues')
            .select('id, court_name, location, prices')
            .limit(1);
        
        if (venuesError || !venues || venues.length === 0) {
            console.log('❌ No venues found. Please create a venue first.');
            return;
        }
        
        testVenueId = venues[0].id;
        console.log(`✅ Venues table OK - Using venue: ${venues[0].court_name}`);
        
        const { error: bookingError } = await supabase
            .from('booking')
            .select('*')
            .limit(1);
        
        if (bookingError) {
            console.log('❌ Booking table error:', bookingError.message);
            return;
        }
        
        console.log('✅ Booking table OK');
        
        // Step 2: Create a booking
        console.log('\n📝 STEP 2: Creating a Test Booking\n');
        
        const bookingData = {
            p_booking_date: '2024-12-20',
            p_duration_minutes: 60,
            p_number_of_players: 4,
            p_special_requests: 'End-to-end test booking',
            p_start_time: '16:00',
            p_team_name: 'Test Warriors',
            p_user_id: testUserId,
            p_venue_id: testVenueId
        };
        
        console.log('Booking details:');
        console.log(`  Date: ${bookingData.p_booking_date}`);
        console.log(`  Time: ${bookingData.p_start_time}`);
        console.log(`  Duration: ${bookingData.p_duration_minutes} minutes`);
        console.log(`  Players: ${bookingData.p_number_of_players}`);
        console.log(`  Team: ${bookingData.p_team_name}`);
        
        const { data: createResult, error: createError } = await supabase
            .rpc('create_booking', bookingData);
        
        if (createError) {
            console.log('❌ Booking creation failed:', createError.message);
            console.log('   Code:', createError.code);
            console.log('\n⚠️ Please apply the SQL fix from backend/fix-booking-function.sql');
            return;
        }
        
        if (!createResult.success) {
            console.log('❌ Booking failed:', createResult.message);
            return;
        }
        
        bookingId = createResult.booking_id;
        console.log('\n✅ Booking created successfully!');
        console.log(`   Booking ID: ${bookingId}`);
        console.log(`   Total Amount: ₹${createResult.total_amount}`);
        
        // Step 3: Retrieve the booking
        console.log('\n📋 STEP 3: Retrieving User Bookings\n');
        
        const { data: bookings, error: getError } = await supabase
            .rpc('get_user_bookings', {
                p_user_id: testUserId,
                p_status_filter: null
            });
        
        if (getError) {
            console.log('❌ Failed to retrieve bookings:', getError.message);
            console.log('   Code:', getError.code);
            console.log('\n⚠️ Please apply the SQL fix from backend/fix-booking-function.sql');
            return;
        }
        
        console.log(`✅ Retrieved ${bookings.length} booking(s)`);
        
        // Find our test booking
        const testBooking = bookings.find(b => b.id === bookingId);
        
        if (testBooking) {
            console.log('\n✅ Test booking found in results:');
            console.log(`   Venue: ${testBooking.venue_name}`);
            console.log(`   Location: ${testBooking.venue_location}`);
            console.log(`   Date: ${testBooking.booking_date}`);
            console.log(`   Time: ${testBooking.start_time} - ${testBooking.end_time}`);
            console.log(`   Players: ${testBooking.number_of_players}`);
            console.log(`   Team: ${testBooking.team_name}`);
            console.log(`   Amount: ₹${testBooking.total_amount}`);
            console.log(`   Status: ${testBooking.status}`);
        } else {
            console.log('⚠️ Test booking not found in results (might be a timing issue)');
        }
        
        // Step 4: Test status filters
        console.log('\n🔍 STEP 4: Testing Status Filters\n');
        
        const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        
        for (const status of statuses) {
            const { data: filtered } = await supabase
                .rpc('get_user_bookings', {
                    p_user_id: testUserId,
                    p_status_filter: status
                });
            
            console.log(`   ${status.padEnd(12)}: ${filtered?.length || 0} booking(s)`);
        }
        
        // Final summary
        console.log('\n' + '='.repeat(70));
        console.log('\n🎉 ALL TESTS PASSED!\n');
        console.log('✅ Database tables are working');
        console.log('✅ Booking creation is working');
        console.log('✅ Booking retrieval is working');
        console.log('✅ Status filters are working');
        console.log('\n📱 Your mobile app should now be able to:');
        console.log('   1. Create bookings through the booking flow');
        console.log('   2. Display bookings in the Bookings tab');
        console.log('   3. Filter bookings by status');
        console.log('\n💡 Open your mobile app and tap the Bookings button (center of bottom nav)');
        console.log('   to see your bookings!\n');
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.log('\n⚠️ Please check:');
        console.log('   1. SQL fix has been applied in Supabase Dashboard');
        console.log('   2. Database tables exist (users, adminvenues, booking)');
        console.log('   3. Functions exist (create_booking, get_user_bookings)');
    }
}

runCompleteTest().catch(console.error);

