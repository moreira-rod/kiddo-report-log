-- Create parent_student_links table to link parents to their children
CREATE TABLE public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(parent_id, student_id)
);

-- Enable RLS on parent_student_links
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- Parents can view their own links
CREATE POLICY "Parents can view their student links"
ON public.parent_student_links
FOR SELECT
USING (auth.uid() = parent_id);

-- Admin/director/coordinator can manage all links
CREATE POLICY "Admin/director/coordinator can manage parent links"
ON public.parent_student_links
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'director') OR 
  public.has_role(auth.uid(), 'coordinator')
);

-- Update students table policies to restrict creation
DROP POLICY IF EXISTS "Teachers can create students" ON public.students;
DROP POLICY IF EXISTS "Admin/director/coordinator can create students" ON public.students;

CREATE POLICY "Admin/director/coordinator can create students"
ON public.students
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'director') OR 
  public.has_role(auth.uid(), 'coordinator')
);

-- Update students view policy to allow parents to see their children
DROP POLICY IF EXISTS "Teachers can view their students" ON public.students;

CREATE POLICY "Teachers can view their students"
ON public.students
FOR SELECT
USING (
  auth.uid() = created_by OR
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'director') OR 
  public.has_role(auth.uid(), 'coordinator')
);

CREATE POLICY "Parents can view their children"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_id = auth.uid() AND student_id = students.id
  )
);

-- Update students update policy
DROP POLICY IF EXISTS "Teachers can update their students" ON public.students;
DROP POLICY IF EXISTS "Admin/director/coordinator can update students" ON public.students;

CREATE POLICY "Admin/director/coordinator can update students"
ON public.students
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'director') OR 
  public.has_role(auth.uid(), 'coordinator')
);

-- Update students delete policy
DROP POLICY IF EXISTS "Teachers can delete their students" ON public.students;
DROP POLICY IF EXISTS "Admin/director/coordinator can delete students" ON public.students;

CREATE POLICY "Admin/director/coordinator can delete students"
ON public.students
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'director') OR 
  public.has_role(auth.uid(), 'coordinator')
);

-- Update classes policies
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Admin/director/coordinator can create classes" ON public.classes;

CREATE POLICY "Admin/director/coordinator can create classes"
ON public.classes
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'director') OR 
  public.has_role(auth.uid(), 'coordinator')
);

-- Update evaluations view policy to allow parents
CREATE POLICY "Parents can view their children's evaluations"
ON public.daily_evaluations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    JOIN public.students s ON s.id = psl.student_id
    WHERE psl.parent_id = auth.uid() AND s.id = daily_evaluations.student_id
  )
);