import client from './client';

export const otpApi = {
	/**
	 * Request an OTP for a phone number
	 * @param phoneNumber Phone number with country code (e.g., +919876543210)
	 */
	sendOTP: async (phoneNumber: string) => {
		try {
			console.log('[OTP API] Sending OTP to', phoneNumber);

			const response = await client.post('/otp/send', {
				phone_number: phoneNumber,
				country_code: '+91' // You might want to extract this from phoneNumber
			});

			console.log('[OTP API] OTP sent successfully:', response.data);
			return {
				success: true,
				message: 'OTP sent successfully',
				otp: '12345', // Dummy OTP for now
				...response.data,
			};
		} catch (error: any) {
			console.error('[OTP API] Exception:', error);
			return {
				success: false,
				message: error.response?.data?.detail || error.message || 'Failed to send OTP',
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

			const response = await client.post('/otp/verify', {
				phone_number: phoneNumber,
				otp_code: otpCode,
			});

			console.log('[OTP API] Verification result:', response.data);

			return {
				success: response.data.success,
				message: response.data.message,
				user_id: response.data.user_id,
				token: response.data.token,
				user: response.data.user
			};
		} catch (error: any) {
			console.error('[OTP API] Exception:', error);
			return {
				success: false,
				message: error.response?.data?.detail || error.message || 'An error occurred during verification',
				user_id: null,
			};
		}
	},
};
