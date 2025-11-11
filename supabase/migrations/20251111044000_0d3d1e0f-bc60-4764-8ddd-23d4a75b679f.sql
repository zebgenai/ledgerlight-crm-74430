-- Add name and username to profiles table
ALTER TABLE public.profiles 
ADD COLUMN name TEXT,
ADD COLUMN username TEXT UNIQUE;

-- Update the trigger function to handle name and username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, username)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$;