-- Drop the existing foreign key constraints on call_sessions
ALTER TABLE public.call_sessions 
DROP CONSTRAINT IF EXISTS call_sessions_caller_id_fkey;

ALTER TABLE public.call_sessions 
DROP CONSTRAINT IF EXISTS call_sessions_callee_id_fkey;

-- Add new foreign key constraints that reference the mentors table for callee_id
-- and users table for caller_id (since mentees are in users table)
ALTER TABLE public.call_sessions 
ADD CONSTRAINT call_sessions_caller_id_fkey 
FOREIGN KEY (caller_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.call_sessions 
ADD CONSTRAINT call_sessions_callee_id_fkey 
FOREIGN KEY (callee_id) 
REFERENCES public.mentors(id) 
ON DELETE CASCADE;