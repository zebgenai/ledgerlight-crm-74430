-- Drop existing foreign key constraints that reference profiles
ALTER TABLE public.in DROP CONSTRAINT IF EXISTS in_created_by_fkey;
ALTER TABLE public.out DROP CONSTRAINT IF EXISTS out_created_by_fkey;
ALTER TABLE public.debt DROP CONSTRAINT IF EXISTS debt_created_by_fkey;
ALTER TABLE public.to_give DROP CONSTRAINT IF EXISTS to_give_created_by_fkey;

-- Add new foreign key constraints that reference auth.users
ALTER TABLE public.in 
  ADD CONSTRAINT in_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.out 
  ADD CONSTRAINT out_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.debt 
  ADD CONSTRAINT debt_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.to_give 
  ADD CONSTRAINT to_give_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;