import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';

export interface Venue {
    id: string;
    court_name: string;
    location: string;
    game_type: string | string[]; // Can be string or array
    prices: number | string;
    description?: string;
    photos?: string[];
    videos?: string[];
    created_at?: string;
}

export interface VenuesFilter {
    location?: string;
    game_type?: string | string[];
    price_min?: number;
    price_max?: number;
    amenities?: string[];
}

export const venuesApi = {
    /**
     * Fetch venues filtered by location and game type
     */
    getVenues: async (filter?: VenuesFilter) => {
        try {
            console.log('[VENUES API] Fetching venues with filter:', filter);

            let query = supabase
                .from('adminvenues')
                .select('*')
                .order('created_at', { ascending: false });

            // Filter by location if provided
            if (filter?.location) {
                query = query.ilike('location', `%${filter.location}%`);
            }

            // Filter by game_type if provided
            if (filter?.game_type) {
                if (Array.isArray(filter.game_type)) {
                    // If game_type is an array in the database, use overlaps
                    // If it's a string, use ilike with OR conditions
                    const gameTypes = filter.game_type;
                    if (gameTypes.length > 0) {
                        // Try array overlap first (if game_type is stored as array)
                        query = query.overlaps('game_type', gameTypes);
                    }
                } else {
                    // Single game type - use ilike for partial match
                    query = query.ilike('game_type', `%${filter.game_type}%`);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error('[VENUES API] Error fetching venues:', error);
                throw error;
            }

            console.log('[VENUES API] Fetched venues:', data?.length || 0);
            return {
                success: true,
                data: data as Venue[],
            };
        } catch (error: any) {
            console.error('[VENUES API] Exception:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },

    /**
     * Get a single venue by ID
     */
    getVenueById: async (venueId: string) => {
        try {
            const { data, error } = await supabase
                .from('adminvenues')
                .select('*')
                .eq('id', venueId)
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data as Venue,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },


};

// Bookings API
export const bookingsApi = {
    /**
     * Test database connection
     */
    testConnection: async () => {
        try {
            // Test basic connection
            const { data: tables, error: tablesError } = await supabase
                .from('adminvenues')
                .select('count')
                .limit(1);

            if (tablesError) {
                console.error('[TEST] Table test failed:', tablesError);
                return { success: false, error: tablesError.message };
            }

            console.log('[TEST] Database connection OK');

            // Test function exists
            const { data: functions, error: funcError } = await supabase.rpc('create_booking', {
                p_booking_date: '2024-01-01',
                p_duration_minutes: 60,
                p_number_of_players: 2,
                p_special_requests: 'test',
                p_start_time: '10:00',
                p_team_name: 'test team',
                p_user_id: '00000000-0000-0000-0000-000000000000',
                p_venue_id: '00000000-0000-0000-0000-000000000000'
            });

            if (funcError && funcError.code === 'PGRST202') {
                console.error('[TEST] Function not found - needs to be created in database');
                return { success: false, error: 'Function not found - run migration SQL', details: funcError };
            }

            return {
                success: true,
                message: 'Database connection and function accessible',
                result: functions
            };
        } catch (error: any) {
            console.error('[TEST] Connection test failed:', error);
            return { success: false, error: error.message, connectionError: true };
        }
    },

    /**
     * Create a new booking
     */
    createBooking: async (bookingData: {
        userId: string;
        venueId: string;
        bookingDate: string;
        startTime: string;
        durationMinutes: number;
        numberOfPlayers?: number;
        teamName?: string;
        specialRequests?: string;
    }) => {
        try {
            const { data, error } = await supabase
                .rpc('create_booking', {
                    p_booking_date: bookingData.bookingDate,
                    p_duration_minutes: bookingData.durationMinutes,
                    p_number_of_players: bookingData.numberOfPlayers || 2,
                    p_special_requests: bookingData.specialRequests || null,
                    p_start_time: bookingData.startTime,
                    p_team_name: bookingData.teamName || null,
                    p_user_id: bookingData.userId,
                    p_venue_id: bookingData.venueId
                });

            if (error) {
                console.error('[BOOKINGS API] Error creating booking:', error);
                throw error;
            }

            console.log('[BOOKINGS API] Booking created successfully:', data);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[BOOKINGS API] Exception creating booking:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Get user's bookings
     */
    getUserBookings: async (userId: string, statusFilter?: string) => {
        try {
            const { data, error } = await supabase
                .rpc('get_user_bookings', {
                    p_user_id: userId,
                    p_status_filter: statusFilter,
                });

            if (error) {
                console.error('[BOOKINGS API] Error fetching bookings:', error);
                throw error;
            }

            console.log('[BOOKINGS API] Fetched user bookings:', data?.length || 0);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[BOOKINGS API] Exception fetching bookings:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },

    /**
     * Update booking status (admin function)
     */
    updateBookingStatus: async (bookingId: string, status: string, adminNotes?: string) => {
        try {
            const { data, error } = await supabase
                .rpc('update_booking_status', {
                    p_booking_id: bookingId,
                    p_status: status,
                    p_admin_notes: adminNotes,
                });

            if (error) {
                console.error('[BOOKINGS API] Error updating booking status:', error);
                throw error;
            }

            console.log('[BOOKINGS API] Booking status updated:', data);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[BOOKINGS API] Exception updating booking status:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },
};
