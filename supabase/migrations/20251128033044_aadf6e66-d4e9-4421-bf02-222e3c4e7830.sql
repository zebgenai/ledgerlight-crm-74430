-- Create stock table for inventory management
CREATE TABLE public.stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_price NUMERIC NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'In Stock',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own stock records"
ON public.stock
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can insert stock records"
ON public.stock
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all stock records"
ON public.stock
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update stock records"
ON public.stock
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete stock records"
ON public.stock
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));