-- Drop the existing foreign key constraint on bookings.mentor_id
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_mentor_id_fkey;

-- Add new foreign key that references the mentors table instead of users table
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_mentor_id_fkey 
FOREIGN KEY (mentor_id) 
REFERENCES public.mentors(id) 
ON DELETE CASCADE;