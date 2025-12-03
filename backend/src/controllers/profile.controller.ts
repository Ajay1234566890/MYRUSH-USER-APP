import { Request, Response } from 'express';
import { supabase } from '../config/database';
import { ApiResponse } from '../types';

export const saveUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      phoneNumber,
      fullName,
      age,
      city,
      gender,
      handedness,
      skillLevel,
      sports,
      playingStyle,
    } = req.body as {
      phoneNumber?: string;
      fullName?: string;
      age?: number | string;
      city?: string;
      gender?: string;
      handedness?: string;
      skillLevel?: string;
      sports?: string[];
      playingStyle?: string;
    };

    if (!phoneNumber) {
      res.status(400).json({
        success: false,
        message: 'phoneNumber is required',
      } as ApiResponse);
      return;
    }

    const parsedAge =
      typeof age === 'number'
        ? age
        : typeof age === 'string' && age.trim() !== ''
        ? parseInt(age, 10) || null
        : null;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          phone_number: phoneNumber,
          full_name: fullName || null,
          age: parsedAge,
          city: city || null,
          gender: gender || null,
          handedness: handedness || null,
          skill_level: skillLevel || null,
          sports: Array.isArray(sports) ? sports : null,
          playing_style: playingStyle || null,
        },
        { onConflict: 'phone_number' }
      )
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to save profile',
        error: error.message,
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      data,
    } as ApiResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Error saving profile',
      error: message,
    } as ApiResponse);
  }
};

export default {
  saveUserProfile,
};

