import { supabase } from './supabase';

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

      const { data, error } = await supabase.rpc('update_user_profile', {
        p_phone_number: payload.phoneNumber,
        p_full_name: payload.fullName,
        p_age: payload.age || null,
        p_city: payload.city,
        p_city_id: payload.city_id || null,
        p_gender: payload.gender || null,
        p_handedness: payload.handedness,
        p_skill_level: payload.skillLevel || null,
        p_favorite_sports: payload.sports,
        p_playing_style: payload.playingStyle,
      });

      if (error && error.message.includes('p_city_id')) {
        // Fallback to old function without p_city_id
        const { data: data2, error: error2 } = await supabase.rpc('update_user_profile', {
          p_phone_number: payload.phoneNumber,
          p_full_name: payload.fullName,
          p_age: payload.age || null,
          p_city: payload.city,
          p_gender: payload.gender || null,
          p_handedness: payload.handedness,
          p_skill_level: payload.skillLevel || null,
          p_favorite_sports: payload.sports,
          p_playing_style: payload.playingStyle,
        });

        if (error2) {
          console.error('[PROFILE API] Fallback Error:', error2);
          return {
            success: false,
            message: error2.message || 'Failed to save profile',
            error: error2.message,
          };
        }

        return {
          success: data2?.success || true,
          message: data2?.message || 'Profile saved successfully (without city_id)',
          data: data2,
        };
      }

      if (error) {
        console.error('[PROFILE API] Error:', error);
        return {
          success: false,
          message: error.message || 'Failed to save profile',
          error: error.message,
        };
      }

      console.log('[PROFILE API] Success:', data);
      return {
        success: data?.success || true,
        message: data?.message || 'Profile saved successfully',
        data,
      };
    } catch (error: any) {
      console.error('[PROFILE API] Exception:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while saving profile',
        error: error.message,
      };
    }
  },

  getProfile: async (phoneNumber: string): Promise<SaveProfileResponse> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error) {
        return {
          success: false,
          message: 'Profile not found',
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve profile',
        error: error.message,
      };
    }
  },

  getCities: async (): Promise<{ success: boolean; data: City[]; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('admin_cities')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) {
        return {
          success: false,
          data: [],
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
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
      const { data, error } = await supabase
        .from('admin_game_types')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) {
        return {
          success: false,
          data: [],
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
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
