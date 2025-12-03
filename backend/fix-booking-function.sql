-- Fix the create_booking function to handle prices as text
-- This fixes the "COALESCE types character varying and numeric cannot be matched" error

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_booking(DATE, INTEGER, INTEGER, TEXT, TIME, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(DATE, INTEGER, INTEGER, TEXT, TIME, TEXT, UUID, UUID) TO anon;

-- Fix the get_user_bookings function to handle VARCHAR types
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_bookings(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_bookings(UUID, TEXT) TO anon;

