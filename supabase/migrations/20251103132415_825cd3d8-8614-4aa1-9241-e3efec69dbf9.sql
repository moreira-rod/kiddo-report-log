-- Fix recursive RLS on user_roles causing 42P17 errors
-- 1) Ensure RLS is enabled (no-op if already)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2) Drop problematic ALL policy that referenced user_roles recursively
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- 3) Create safe, non-recursive admin policies using security definer helper
-- Allow admins to read all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
