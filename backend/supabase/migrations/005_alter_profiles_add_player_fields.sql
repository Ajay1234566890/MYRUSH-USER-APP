-- Add player profile fields to existing profiles table
-- This keeps profiles as the single source for both auth and player data.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS handedness TEXT,
  ADD COLUMN IF NOT EXISTS skill_level TEXT,
  ADD COLUMN IF NOT EXISTS sports TEXT[],
  ADD COLUMN IF NOT EXISTS playing_style TEXT;

