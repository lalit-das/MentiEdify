-- Fix the security issue with the function search path
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