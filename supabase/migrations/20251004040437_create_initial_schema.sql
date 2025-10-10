/*
  # Create Initial MentiEdify Schema

  1. New Tables
    - `users` - User profiles for mentees and mentors
    - `mentors` - Mentor-specific information and settings
    - `bookings` - Session bookings between mentees and mentors
    - `messages` - Chat messages between users
    - `reviews` - Mentor ratings and reviews
    - `call_sessions` - WebRTC call tracking
    - `notifications` - User notifications
    - `mentor_availability` - Mentor availability schedule

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated user access
    - Restrict data access based on user ownership

  3. Notes
    - Creates comprehensive schema for mentorship platform
    - Includes automated user profile creation on signup
    - Sets up proper foreign key relationships
*/

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  user_type TEXT DEFAULT 'mentee' CHECK (user_type IN ('mentee', 'mentor', 'admin')),
  role TEXT DEFAULT 'mentee' CHECK (role IN ('mentee', 'mentor', 'admin')),
  profile_image_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mentors table
CREATE TABLE IF NOT EXISTS public.mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  expertise TEXT[] DEFAULT '{}',
  years_of_experience INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  profile_image_url TEXT,
  video_intro_url TEXT,
  session_types TEXT[] DEFAULT '{video,audio,chat}',
  response_time_hours INTEGER DEFAULT 24,
  cancellation_policy TEXT DEFAULT 'flexible',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bookings table with correct foreign key
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  mentee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  duration INTEGER DEFAULT 60,
  session_type TEXT DEFAULT 'video' CHECK (session_type IN ('video', 'audio', 'chat')),
  package_type TEXT DEFAULT 'session',
  price DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create call_sessions table
CREATE TABLE IF NOT EXISTS public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  caller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  callee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'connected', 'ended', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mentor_availability table
CREATE TABLE IF NOT EXISTS public.mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mentor_id, day_of_week, start_time, end_time)
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all profiles"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- RLS Policies for mentors
CREATE POLICY "Anyone can view mentors"
ON public.mentors FOR SELECT
USING (true);

CREATE POLICY "Mentors can update own profile"
ON public.mentors FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create mentor profile"
ON public.mentors FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (
  mentee_id = auth.uid() OR 
  mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
);

CREATE POLICY "Mentees can create bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (mentee_id = auth.uid());

CREATE POLICY "Users can update their bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (
  mentee_id = auth.uid() OR 
  mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
)
WITH CHECK (
  mentee_id = auth.uid() OR 
  mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
);

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- RLS Policies for reviews
CREATE POLICY "Anyone can view public reviews"
ON public.reviews FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create reviews for their bookings"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  reviewer_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND mentee_id = auth.uid()
  )
);

-- RLS Policies for call_sessions
CREATE POLICY "Users can view their own call sessions"
ON public.call_sessions FOR SELECT
TO authenticated
USING (caller_id = auth.uid() OR callee_id = auth.uid());

CREATE POLICY "Users can create call sessions for their bookings"
ON public.call_sessions FOR INSERT
TO authenticated
WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Participants can update call sessions"
ON public.call_sessions FOR UPDATE
TO authenticated
USING (caller_id = auth.uid() OR callee_id = auth.uid())
WITH CHECK (caller_id = auth.uid() OR callee_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for mentor_availability
CREATE POLICY "Anyone can view mentor availability"
ON public.mentor_availability FOR SELECT
USING (true);

CREATE POLICY "Mentors can manage their availability"
ON public.mentor_availability FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mentors 
    WHERE id = mentor_id AND user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_mentors_user_id ON public.mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor_id ON public.bookings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentee_id ON public.bookings(mentee_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_mentor_id ON public.reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_call_sessions_booking_id ON public.call_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_mentor_availability_mentor_day ON public.mentor_availability(mentor_id, day_of_week);

-- Create triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentors_updated_at
  BEFORE UPDATE ON public.mentors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update mentor ratings
CREATE OR REPLACE FUNCTION public.update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.mentors 
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2) 
      FROM public.reviews 
      WHERE mentor_id = NEW.mentor_id
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.reviews 
      WHERE mentor_id = NEW.mentor_id
    )
  WHERE id = NEW.mentor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update mentor ratings
CREATE TRIGGER update_mentor_rating_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_mentor_rating();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    user_type
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'mentee')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
