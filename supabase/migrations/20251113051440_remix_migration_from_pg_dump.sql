--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


SET default_table_access_method = heap;

--
-- Name: debt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debt (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_name text NOT NULL,
    amount numeric NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    status text DEFAULT 'Not Returned'::text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT debt_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT debt_status_check CHECK ((status = ANY (ARRAY['Not Returned'::text, 'Returned'::text])))
);


--
-- Name: in; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."in" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    amount numeric NOT NULL,
    reason text NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT in_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: out; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."out" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    amount numeric NOT NULL,
    reason text NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT out_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    username text
);


--
-- Name: to_give; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.to_give (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_name text NOT NULL,
    amount numeric NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    status text DEFAULT 'Unpaid'::text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT to_give_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT to_give_status_check CHECK ((status = ANY (ARRAY['Unpaid'::text, 'Paid'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: debt debt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt
    ADD CONSTRAINT debt_pkey PRIMARY KEY (id);


--
-- Name: in in_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."in"
    ADD CONSTRAINT in_pkey PRIMARY KEY (id);


--
-- Name: out out_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."out"
    ADD CONSTRAINT out_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: to_give to_give_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.to_give
    ADD CONSTRAINT to_give_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: debt debt_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt
    ADD CONSTRAINT debt_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: in in_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."in"
    ADD CONSTRAINT in_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: out out_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."out"
    ADD CONSTRAINT out_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: to_give to_give_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.to_give
    ADD CONSTRAINT to_give_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: debt Admins can delete debt records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete debt records" ON public.debt FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: in Admins can delete in records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete in records" ON public."in" FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: out Admins can delete out records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete out records" ON public."out" FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: to_give Admins can delete to_give records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete to_give records" ON public.to_give FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: debt Admins can update debt records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update debt records" ON public.debt FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: in Admins can update in records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update in records" ON public."in" FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: out Admins can update out records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update out records" ON public."out" FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: to_give Admins can update to_give records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update to_give records" ON public.to_give FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: debt Authenticated users can insert debt records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert debt records" ON public.debt FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: in Authenticated users can insert in records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert in records" ON public."in" FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: out Authenticated users can insert out records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert out records" ON public."out" FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: to_give Authenticated users can insert to_give records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert to_give records" ON public.to_give FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: debt Authenticated users can view all debt records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all debt records" ON public.debt FOR SELECT TO authenticated USING (true);


--
-- Name: in Authenticated users can view all in records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all in records" ON public."in" FOR SELECT TO authenticated USING (true);


--
-- Name: out Authenticated users can view all out records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all out records" ON public."out" FOR SELECT TO authenticated USING (true);


--
-- Name: to_give Authenticated users can view all to_give records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all to_give records" ON public.to_give FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: debt; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.debt ENABLE ROW LEVEL SECURITY;

--
-- Name: in; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."in" ENABLE ROW LEVEL SECURITY;

--
-- Name: out; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."out" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: to_give; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.to_give ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


