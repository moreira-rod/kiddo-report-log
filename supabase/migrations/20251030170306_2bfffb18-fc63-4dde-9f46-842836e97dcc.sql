-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by authenticated users
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
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

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Create trigger function to create profile and assign teacher role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign teacher role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'teacher');
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create classes table for class groups
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  school_year TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Teachers and admins can view classes they created or are assigned to
CREATE POLICY "Users can view their classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by OR
  public.has_role(auth.uid(), 'admin')
);

-- Teachers and admins can create classes
CREATE POLICY "Teachers can create classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);

-- Teachers can update their own classes, admins can update all
CREATE POLICY "Teachers can update own classes"
ON public.classes
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by OR
  public.has_role(auth.uid(), 'admin')
);

-- Teachers can delete their own classes, admins can delete all
CREATE POLICY "Teachers can delete own classes"
ON public.classes
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by OR
  public.has_role(auth.uid(), 'admin')
);

-- Fix nullable created_by columns - First update existing NULL values
UPDATE public.students SET created_by = (SELECT id FROM auth.users LIMIT 1) WHERE created_by IS NULL;
UPDATE public.daily_evaluations SET created_by = (SELECT id FROM auth.users LIMIT 1) WHERE created_by IS NULL;

-- Now make columns NOT NULL
ALTER TABLE public.students ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.daily_evaluations ALTER COLUMN created_by SET NOT NULL;

-- Add class_id to students table
ALTER TABLE public.students ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_classes_created_by ON public.classes(created_by);

-- Update trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();