import client from './client';

export interface SaveProfilePayload {
  phoneNumber: string;
  fullName: string;
  age?: number;
  city: string;
  city_id?: string | null;
  gender?: string;
  handedness: string;
  skillLevel?: string;
  sports: string[];
  playingStyle: string;
}

export interface City {
  id: string;
  name: string;
}

export interface GameType {
  id: string;
  name: string;
}

export interface SaveProfileResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const profileApi = {
  saveProfile: async (payload: SaveProfilePayload): Promise<SaveProfileResponse> => {
    try {
      console.log('[PROFILE API] Saving profile:', payload);

      const response = await client.post('/profile/save', {
        phone_number: payload.phoneNumber,
        full_name: payload.fullName,
        age: payload.age,
        city: payload.city,
        gender: payload.gender,
        handedness: payload.handedness,
        skill_level: payload.skillLevel,
        favorite_sports: payload.sports,
        playing_style: payload.playingStyle,
      });

      console.log('[PROFILE API] Success:', response.data);
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[PROFILE API] Exception:', error);
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'An error occurred while saving profile',
        error: error.message,
      };
    }
  },

  getProfile: async (phoneNumber: string): Promise<SaveProfileResponse> => {
    try {
      const response = await client.get(`/profile/${phoneNumber}`);

      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data.user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Failed to retrieve profile',
        error: error.message,
      };
    }
  },

  getCities: async (): Promise<{ success: boolean; data: City[]; error?: string }> => {
    try {
      const response = await client.get('/common/cities');
      return {
        success: response.data.success,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  getGameTypes: async (): Promise<{ success: boolean; data: GameType[]; error?: string }> => {
    try {
      const response = await client.get('/common/game-types');
      return {
        success: response.data.success,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },
};

export default profileApi;
