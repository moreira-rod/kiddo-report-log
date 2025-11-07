-- Add teacher_id to students table
ALTER TABLE public.students 
ADD COLUMN teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for teacher_id
CREATE INDEX idx_students_teacher_id ON public.students(teacher_id);

-- Update RLS policy for teachers to view students assigned to them
DROP POLICY IF EXISTS "Teachers can view their students" ON public.students;
CREATE POLICY "Teachers can view their students" 
ON public.students 
FOR SELECT 
USING (
  auth.uid() = created_by 
  OR auth.uid() = teacher_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'director'::app_role) 
  OR has_role(auth.uid(), 'coordinator'::app_role)
);

-- Update RLS policy for teachers to create evaluations for their assigned students
DROP POLICY IF EXISTS "Teachers can create evaluations for their students" ON public.daily_evaluations;
CREATE POLICY "Teachers can create evaluations for their students" 
ON public.daily_evaluations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = daily_evaluations.student_id 
    AND (students.created_by = auth.uid() OR students.teacher_id = auth.uid())
  )
);

-- Update RLS policy for teachers to view evaluations of their assigned students
DROP POLICY IF EXISTS "Teachers can view evaluations of their students" ON public.daily_evaluations;
CREATE POLICY "Teachers can view evaluations of their students" 
ON public.daily_evaluations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = daily_evaluations.student_id 
    AND (students.created_by = auth.uid() OR students.teacher_id = auth.uid())
  )
);

-- Update RLS policy for teachers to update evaluations of their assigned students
DROP POLICY IF EXISTS "Teachers can update evaluations of their students" ON public.daily_evaluations;
CREATE POLICY "Teachers can update evaluations of their students" 
ON public.daily_evaluations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = daily_evaluations.student_id 
    AND (students.created_by = auth.uid() OR students.teacher_id = auth.uid())
  )
);

-- Update RLS policy for teachers to delete evaluations of their assigned students
DROP POLICY IF EXISTS "Teachers can delete evaluations of their students" ON public.daily_evaluations;
CREATE POLICY "Teachers can delete evaluations of their students" 
ON public.daily_evaluations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = daily_evaluations.student_id 
    AND (students.created_by = auth.uid() OR students.teacher_id = auth.uid())
  )
);