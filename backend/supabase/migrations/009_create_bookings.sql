-- COMPLETE FRESH BOOKINGS TABLE CREATION WITH WORKING FUNCTION
-- This script drops everything and recreates with correct function signature

-- Drop everything first
DROP TABLE IF EXISTS public.booking CASCADE;
DROP FUNCTION IF EXISTS public.create_booking(
  p_booking_date DATE,
  p_duration_minutes INTEGER,
  p_number_of_players INTEGER,
  p_special_requests TEXT,
  p_start_time TIME,
  p_team_name TEXT,
  p_user_id UUID,
  p_venue_id UUID
);
DROP FUNCTION IF EXISTS public.create_booking(UUID, UUID, DATE, TIME, INTEGER, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_bookings(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_booking_status(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.check_booking_conflict(UUID, DATE, TIME, TIME);

-- Create fresh booking table (singular, as per user's table name)
CREATE TABLE public.booking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.adminvenues(id) ON DELETE CASCADE,

  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Players and team info
  number_of_players INTEGER NOT NULL DEFAULT 2,
  team_name TEXT,
  special_requests TEXT,

  -- Pricing
  price_per_hour DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Booking status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded')),

  -- Payment details (to be added later)
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Admin notes/remarks
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.booking(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON public.booking(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.booking(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.booking(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.booking(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.booking(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.booking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create bookings for themselves
CREATE POLICY "Users can create own bookings"
  ON public.booking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their pending bookings
CREATE POLICY "Users can update own pending bookings"
  ON public.booking FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Users can cancel their confirmed bookings
CREATE POLICY "Users can cancel own confirmed bookings"
  ON public.booking FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'confirmed')
  WITH CHECK (status = 'cancelled');

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.booking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND phone_number IN ('+919876543210', '+919876543211') -- Replace with actual admin phone numbers
    )
  );

-- Admins can update any booking
CREATE POLICY "Admins can update any booking"
  ON public.booking FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND phone_number IN ('+919876543210', '+919876543211') -- Replace with actual admin phone numbers
    )
  );

-- Function to check for booking conflicts
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  p_venue_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if there's any overlapping booking for the same venue and date
  RETURN EXISTS (
    SELECT 1 FROM public.booking
    WHERE venue_id = p_venue_id
      AND booking_date = p_booking_date
      AND status NOT IN ('cancelled', 'refunded')
      AND (
        (start_time <= p_start_time AND end_time > p_start_time) OR
        (start_time < p_end_time AND end_time >= p_end_time) OR
        (start_time >= p_start_time AND end_time <= p_end_time)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a booking (parameter order matches mobile app calls)
CREATE OR REPLACE FUNCTION public.create_booking(
  p_booking_date DATE,
  p_duration_minutes INTEGER,
  p_number_of_players INTEGER,
  p_special_requests TEXT,
  p_start_time TIME,
  p_team_name TEXT,
  p_user_id UUID,
  p_venue_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_venue_record RECORD;
  v_end_time TIME;
  v_price_per_hour DECIMAL(10,2);
  v_total_amount DECIMAL(10,2);
  v_booking_id UUID;
BEGIN
  -- Calculate end time
  v_end_time := p_start_time + (p_duration_minutes || ' minutes')::INTERVAL;

  -- Get venue pricing info
  SELECT * INTO v_venue_record
  FROM public.adminvenues
  WHERE id = p_venue_id;

  IF v_venue_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Venue not found'
    );
  END IF;

  -- Convert prices from text to decimal, with fallback to 800.00
  BEGIN
    v_price_per_hour := COALESCE(v_venue_record.prices::DECIMAL(10,2), 800.00);
  EXCEPTION WHEN OTHERS THEN
    v_price_per_hour := 800.00;
  END;

  -- Calculate total amount
  v_total_amount := v_price_per_hour * (p_duration_minutes / 60.0);

  -- Check for booking conflicts
  IF EXISTS (
    SELECT 1 FROM public.booking
    WHERE venue_id = p_venue_id
      AND booking_date = p_booking_date
      AND status NOT IN ('cancelled', 'refunded')
      AND (
        (start_time, end_time) OVERLAPS (p_start_time, v_end_time)
      )
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'This time slot is already booked'
    );
  END IF;

  -- Create the booking
  INSERT INTO public.booking (
    user_id, venue_id, booking_date, start_time, end_time, duration_minutes,
    number_of_players, team_name, special_requests, price_per_hour, total_amount
  ) VALUES (
    p_user_id, p_venue_id, p_booking_date, p_start_time, v_end_time, p_duration_minutes,
    p_number_of_players, p_team_name, p_special_requests, v_price_per_hour, v_total_amount
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Booking created successfully',
    'booking_id', v_booking_id,
    'total_amount', v_total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update booking status
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_booking_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_old_status TEXT;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status
  FROM public.booking
  WHERE id = p_booking_id;

  IF v_old_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Booking not found'
    );
  END IF;

  -- Update the booking
  UPDATE public.booking
  SET
    status = p_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Booking status updated successfully',
    'booking_id', p_booking_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get bookings for a user
CREATE OR REPLACE FUNCTION public.get_user_bookings(
  p_user_id UUID,
  p_status_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  venue_name TEXT,
  venue_location TEXT,
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  number_of_players INTEGER,
  team_name TEXT,
  special_requests TEXT,
  total_amount DECIMAL(10,2),
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Return bookings with venue details
  RETURN QUERY
  SELECT
    b.id,
    v.court_name::TEXT as venue_name,
    v.location::TEXT as venue_location,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.number_of_players,
    b.team_name,
    b.special_requests,
    b.total_amount,
    b.status,
    b.created_at
  FROM public.booking b
  JOIN public.adminvenues v ON b.venue_id = v.id
  WHERE b.user_id = p_user_id
    AND (p_status_filter IS NULL OR b.status = p_status_filter)
  ORDER BY b.booking_date DESC, b.start_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_booking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.booking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_updated_at();
