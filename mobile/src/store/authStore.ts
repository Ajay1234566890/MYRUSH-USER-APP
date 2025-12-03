import { create } from 'zustand';
import { supabase } from '../api/supabase';

export interface UserProfile {
  id: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithPhone: (phoneNumber: string, otpCode: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (credentials: LoginCredentials): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return false;
      }

      if (data.user && data.session) {
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            firstName: profile?.first_name || data.user.user_metadata?.first_name || '',
            lastName: profile?.last_name || data.user.user_metadata?.last_name || '',
          },
          token: data.session.access_token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      set({ isLoading: false, error: 'Login failed' });
      return false;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Login failed' });
      return false;
    }
  },

  loginWithPhone: async (phoneNumber: string, otpCode: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // 1. Verify OTP using Supabase function
      const { otpApi } = require('../api/otp');
      const result = await otpApi.verifyOTP(phoneNumber, otpCode);

      console.log('[AUTH] OTP verification result:', result);

      if (!result || !result.success) {
        set({ isLoading: false, error: result?.message || 'Invalid OTP' });
        return false;
      }

      // 2. Fetch user data from Supabase users table
      // Try by user_id first, then fallback to phone_number
      let userData = null;
      let userError = null;

      if (result.user_id) {
        const response = await supabase
          .from('users')
          .select('*')
          .eq('id', result.user_id)
          .maybeSingle();

        userData = response.data;
        userError = response.error;
      }

      // Fallback: try to find by phone number
      if (!userData) {
        console.log('[AUTH] User not found by ID, trying phone number:', phoneNumber);
        const response = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', phoneNumber)
          .maybeSingle();

        userData = response.data;
        userError = response.error;
      }

      if (userError) {
        console.error('[AUTH] Error fetching user:', userError);
        set({ isLoading: false, error: 'Failed to fetch user profile' });
        return false;
      }

      if (!userData) {
        console.error('[AUTH] User not found in database');
        set({ isLoading: false, error: 'User not found. Please try again.' });
        return false;
      }

      console.log('[AUTH] User data fetched:', userData);

      // 3. Set auth state with real user data
      set({
        user: {
          id: userData.id,
          phoneNumber: userData.phone_number,
          firstName: userData.full_name || 'User',
          lastName: '',
          email: userData.email,
          fullName: userData.full_name,
        },
        token: `phone-auth-${userData.id}`,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      set({ isLoading: false, error: error.message || 'Login failed' });
      return false;
    }
  },

  register: async (data: RegisterData): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return false;
      }

      if (authData.user && authData.session) {
        // Create profile
        await supabase.from('profiles').insert({
          id: authData.user.id,
          email: authData.user.email,
          first_name: data.firstName,
          last_name: data.lastName,
        });

        set({
          user: {
            id: authData.user.id,
            email: authData.user.email || '',
            firstName: data.firstName,
            lastName: data.lastName,
          },
          token: authData.session.access_token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      set({ isLoading: false, error: 'Registration failed' });
      return false;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Registration failed' });
      return false;
    }
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            firstName: profile?.first_name || session.user.user_metadata?.first_name || '',
            lastName: profile?.last_name || session.user.user_metadata?.last_name || '',
          },
          token: session.access_token,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;

