import { create } from 'zustand';
import client from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { otpApi } from '../api/otp';

export interface UserProfile {
  id: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profileCompleted?: boolean;
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
  updateUser: (user: Partial<UserProfile>) => void;
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
      const response = await client.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      const { data } = response.data;

      if (data.token) {
        await AsyncStorage.setItem('auth_token', data.token);
      }

      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          fullName: data.user.fullName,
          profileCompleted: data.user.profile_completed,
        },
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      const message = error.response?.data?.detail || error.message || 'Login failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  loginWithPhone: async (phoneNumber: string, otpCode: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // Verify OTP using Python backend
      const result = await otpApi.verifyOTP(phoneNumber, otpCode);

      console.log('[AUTH] OTP verification result:', result);

      if (!result || !result.success) {
        set({ isLoading: false, error: result?.message || 'Invalid OTP' });
        return false;
      }

      const userData = result.user;
      const token = result.token;

      if (token) {
        await AsyncStorage.setItem('auth_token', token);
      }

      set({
        user: {
          id: userData.id,
          phoneNumber: userData.phoneNumber,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          fullName: userData.fullName,
          profileCompleted: userData.profileCompleted,
        },
        token: token,
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
      const response = await client.post('/auth/register', {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      const { data: responseData } = response.data;

      if (responseData.token) {
        await AsyncStorage.setItem('auth_token', responseData.token);
      }

      set({
        user: {
          id: responseData.user.id,
          email: responseData.user.email,
          firstName: responseData.user.firstName,
          lastName: responseData.user.lastName,
          fullName: responseData.user.fullName,
          profileCompleted: responseData.user.profile_completed,
        },
        token: responseData.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      console.error('[AUTH] Registration error:', error);
      const message = error.response?.data?.detail || error.message || 'Registration failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('auth_token');
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
      const token = await AsyncStorage.getItem('auth_token');

      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Verify token and get profile
      const response = await client.get('/auth/profile');
      const { data } = response.data;

      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          fullName: data.user.fullName,
          profileCompleted: data.user.profile_completed,
        },
        token: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('[AUTH] Check auth error:', error);
      await AsyncStorage.removeItem('auth_token');
      set({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null
      });
    }
  },

  updateUser: (userData: Partial<UserProfile>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    }));
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
