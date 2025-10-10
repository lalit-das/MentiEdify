-- First, let's clean up redundant tables and create a proper schema for MentiEdify

-- Drop redundant tables (keeping the most comprehensive ones)
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.mentor_sessions CASCADE;

-- Update users table for comprehensive profile management
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'mentee' CHECK (role IN ('mentee', 'mentor', 'admin')),
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update mentors table with additional fields
ALTER TABLE public.mentors
ADD COLUMN IF NOT EXISTS video_intro_url TEXT,
ADD COLUMN IF NOT EXISTS session_types TEXT[] DEFAULT '{video,audio,chat}',
ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'flexible';

-- Create messages table for chat functionality
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

-- Create reviews table for mentor ratings
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

-- Create call_sessions table for WebRTC call management
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
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT 
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" 
ON public.messages FOR UPDATE 
USING (sender_id = auth.uid());

-- RLS Policies for reviews
CREATE POLICY "Anyone can view public reviews" 
ON public.reviews FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can create reviews for their bookings" 
ON public.reviews FOR INSERT 
WITH CHECK (reviewer_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE id = booking_id AND mentee_id = auth.uid()
));

-- RLS Policies for call_sessions
CREATE POLICY "Users can view their own call sessions" 
ON public.call_sessions FOR SELECT 
USING (caller_id = auth.uid() OR callee_id = auth.uid());

CREATE POLICY "Users can create call sessions for their bookings" 
ON public.call_sessions FOR INSERT 
WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Participants can update call sessions" 
ON public.call_sessions FOR UPDATE 
USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for mentor_availability
CREATE POLICY "Anyone can view mentor availability" 
ON public.mentor_availability FOR SELECT 
USING (true);

CREATE POLICY "Mentors can manage their availability" 
ON public.mentor_availability FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.mentors 
  WHERE id = mentor_id AND user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_mentor_id ON public.reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_call_sessions_booking_id ON public.call_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_mentor_availability_mentor_day ON public.mentor_availability(mentor_id, day_of_week);

-- Create triggers for updating timestamps
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update mentor ratings after review
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update mentor ratings
CREATE TRIGGER update_mentor_rating_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_mentor_rating();