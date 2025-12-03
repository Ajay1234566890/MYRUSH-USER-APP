import { Request } from 'express';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Supabase profile type
export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at?: string;
  updated_at?: string;
}

