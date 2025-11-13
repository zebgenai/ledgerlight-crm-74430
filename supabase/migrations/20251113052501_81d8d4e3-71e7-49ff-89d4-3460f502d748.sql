-- Drop overly permissive SELECT policies on financial tables
DROP POLICY IF EXISTS "Authenticated users can view all in records" ON public.in;
DROP POLICY IF EXISTS "Authenticated users can view all out records" ON public.out;
DROP POLICY IF EXISTS "Authenticated users can view all debt records" ON public.debt;
DROP POLICY IF EXISTS "Authenticated users can view all to_give records" ON public.to_give;

-- Create owner-scoped SELECT policies for 'in' table
CREATE POLICY "Users can view their own in records"
  ON public.in
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all in records"
  ON public.in
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create owner-scoped SELECT policies for 'out' table
CREATE POLICY "Users can view their own out records"
  ON public.out
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all out records"
  ON public.out
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create owner-scoped SELECT policies for 'debt' table
CREATE POLICY "Users can view their own debt records"
  ON public.debt
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all debt records"
  ON public.debt
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create owner-scoped SELECT policies for 'to_give' table
CREATE POLICY "Users can view their own to_give records"
  ON public.to_give
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all to_give records"
  ON public.to_give
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));