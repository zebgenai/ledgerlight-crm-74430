-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create In table (income)
CREATE TABLE public.in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on in table
ALTER TABLE public.in ENABLE ROW LEVEL SECURITY;

-- Create Out table (expenses)
CREATE TABLE public.out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on out table
ALTER TABLE public.out ENABLE ROW LEVEL SECURITY;

-- Create ToGive table
CREATE TABLE public.to_give (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  status TEXT DEFAULT 'Unpaid' NOT NULL CHECK (status IN ('Unpaid', 'Paid')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on to_give table
ALTER TABLE public.to_give ENABLE ROW LEVEL SECURITY;

-- Create Debt table
CREATE TABLE public.debt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  status TEXT DEFAULT 'Not Returned' NOT NULL CHECK (status IN ('Not Returned', 'Returned')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on debt table
ALTER TABLE public.debt ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for in table
CREATE POLICY "Authenticated users can view all in records"
  ON public.in FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert in records"
  ON public.in FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update in records"
  ON public.in FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete in records"
  ON public.in FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for out table
CREATE POLICY "Authenticated users can view all out records"
  ON public.out FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert out records"
  ON public.out FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update out records"
  ON public.out FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete out records"
  ON public.out FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for to_give table
CREATE POLICY "Authenticated users can view all to_give records"
  ON public.to_give FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert to_give records"
  ON public.to_give FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update to_give records"
  ON public.to_give FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete to_give records"
  ON public.to_give FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for debt table
CREATE POLICY "Authenticated users can view all debt records"
  ON public.debt FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert debt records"
  ON public.debt FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update debt records"
  ON public.debt FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete debt records"
  ON public.debt FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));