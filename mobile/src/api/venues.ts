import client from './client';
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

            // Note: Filtering logic should be implemented in backend
            // For now, we fetch all and filter client-side if needed, or update backend to support filters
            const response = await client.get('/venues/');

            console.log('[VENUES API] Fetched venues:', response.data.data?.length || 0);
            return {
                success: true,
                data: response.data.data as Venue[],
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
            const response = await client.get(`/venues/${venueId}`);

            return {
                success: true,
                data: response.data.data as Venue,
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
            const response = await client.get('/health');

            if (response.data.status === 'healthy') {
                return {
                    success: true,
                    message: 'Backend connection OK',
                    result: response.data
                };
            }

            return { success: false, error: 'Backend unhealthy' };
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
            const response = await client.post('/bookings/', {
                venue_id: bookingData.venueId,
                booking_date: bookingData.bookingDate,
                start_time: bookingData.startTime,
                duration_minutes: bookingData.durationMinutes,
                number_of_players: bookingData.numberOfPlayers,
                team_name: bookingData.teamName,
                special_requests: bookingData.specialRequests
            });

            console.log('[BOOKINGS API] Booking created successfully:', response.data);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error: any) {
            console.error('[BOOKINGS API] Exception creating booking:', error);
            return {
                success: false,
                data: null,
                error: error.response?.data?.detail || error.message,
            };
        }
    },

    /**
     * Get user's bookings
     */
    getUserBookings: async (userId: string, statusFilter?: string) => {
        try {
            const response = await client.get('/bookings/my-bookings');

            console.log('[BOOKINGS API] Fetched user bookings:', response.data.data?.length || 0);
            return {
                success: true,
                data: response.data.data,
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
        // Not implemented in backend yet
        console.warn('updateBookingStatus not implemented in backend');
        return {
            success: false,
            data: null,
            error: 'Not implemented'
        };
    },
};
