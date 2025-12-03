import { Request, Response } from 'express';
import { supabase, supabaseAuth } from '../config/database';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      res.status(400).json({
        success: false,
        message: authError.message,
      });
      return;
    }

    if (!authData.user) {
      res.status(400).json({
        success: false,
        message: 'Failed to create user',
      });
      return;
    }

    // Insert user profile into profiles table
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: authData.user.email,
      first_name: firstName,
      last_name: lastName,
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName,
          lastName,
        },
        token: authData.session?.access_token || '',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: profile?.first_name || data.user.user_metadata?.first_name || '',
          lastName: profile?.last_name || data.user.user_metadata?.last_name || '',
        },
        token: data.session.access_token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user?.id,
          email: req.user?.email,
          firstName: req.user?.firstName,
          lastName: req.user?.lastName,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
    });
  }
};

