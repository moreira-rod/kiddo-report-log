-- Add student role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'student';

-- Add hierarchy fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS managed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add hierarchy fields to classes table  
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS managed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for better performance on hierarchy queries
CREATE INDEX IF NOT EXISTS idx_profiles_managed_by ON public.profiles(managed_by);
CREATE INDEX IF NOT EXISTS idx_classes_managed_by ON public.classes(managed_by);

-- Update RLS policies for hierarchical access

-- Directors can manage coordinators
DROP POLICY IF EXISTS "Directors can view all profiles" ON public.profiles;
CREATE POLICY "Directors can view all profiles"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  managed_by = auth.uid() OR
  id = auth.uid()
);

-- Coordinators can manage teachers
DROP POLICY IF EXISTS "Coordinators can view managed profiles" ON public.profiles;
CREATE POLICY "Coordinators can view managed profiles"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'coordinator'::app_role) AND (managed_by = auth.uid() OR id = auth.uid())
);

-- Update classes policies for hierarchical management
DROP POLICY IF EXISTS "Admin/director/coordinator can create classes" ON public.classes;
CREATE POLICY "Hierarchical create classes"
ON public.classes FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'coordinator'::app_role)
);

DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
CREATE POLICY "Hierarchical update classes"
ON public.classes FOR UPDATE
USING (
  auth.uid() = created_by OR
  auth.uid() = managed_by OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role)
);

DROP POLICY IF EXISTS "Teachers can delete own classes" ON public.classes;
CREATE POLICY "Hierarchical delete classes"
ON public.classes FOR DELETE
USING (
  auth.uid() = created_by OR
  auth.uid() = managed_by OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role)
);

DROP POLICY IF EXISTS "Users can view their classes" ON public.classes;
CREATE POLICY "Hierarchical view classes"
ON public.classes FOR SELECT
USING (
  auth.uid() = created_by OR
  auth.uid() = managed_by OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'coordinator'::app_role) OR
  -- Parents can view classes of their children
  EXISTS (
    SELECT 1 FROM parent_student_links psl
    JOIN students s ON s.id = psl.student_id
    WHERE psl.parent_id = auth.uid() AND s.class_id = classes.id
  )
);