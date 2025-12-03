import { supabase } from './supabase';

const DUMMY_OTP = '12345';

export const otpApi = {
	/**
	 * Request an OTP for a phone number
	 * @param phoneNumber Phone number with country code (e.g., +919876543210)
	 */
	sendOTP: async (phoneNumber: string) => {
		try {
			console.log('[OTP API] Sending OTP to', phoneNumber);

			// Call Supabase function to create OTP record
			const { data, error } = await supabase.rpc('request_otp', {
				p_phone_number: phoneNumber,
			});

			if (error) {
				console.error('[OTP API] Error:', error);
				throw error;
			}

			console.log('[OTP API] OTP sent successfully:', data);
			return {
				success: true,
				message: 'OTP sent successfully',
				otp: DUMMY_OTP, // In production, this wouldn't be returned
				...data,
			};
		} catch (error: any) {
			console.error('[OTP API] Exception:', error);
			return {
				success: false,
				message: error.message || 'Failed to send OTP',
			};
		}
	},

	/**
	 * Verify the OTP code
	 * @param phoneNumber Phone number
	 * @param otpCode OTP code entered by user
	 */
	verifyOTP: async (phoneNumber: string, otpCode: string) => {
		try {
			console.log('[OTP API] Verifying OTP for', phoneNumber);

			// Call Supabase function to verify OTP
			const { data, error } = await supabase.rpc('verify_otp', {
				p_phone_number: phoneNumber,
				p_otp_code: otpCode,
			});

			if (error) {
				console.error('[OTP API] Verification error:', error);
				return {
					success: false,
					message: error.message || 'Failed to verify OTP',
					user_id: null,
				};
			}

			console.log('[OTP API] Verification result:', data);
			console.log('[OTP API] Verification result type:', typeof data, 'isArray:', Array.isArray(data));

			// The verify_otp function returns a table with success, message, user_id
			// It might be an array or a single object
			const result = Array.isArray(data) ? data[0] : data;

			console.log('[OTP API] Parsed result:', result);

			return {
				success: result?.success || false,
				message: result?.message || 'Verification completed',
				user_id: result?.user_id || null,
			};
		} catch (error: any) {
			console.error('[OTP API] Exception:', error);
			return {
				success: false,
				message: error.message || 'An error occurred during verification',
				user_id: null,
			};
		}
	},
};
