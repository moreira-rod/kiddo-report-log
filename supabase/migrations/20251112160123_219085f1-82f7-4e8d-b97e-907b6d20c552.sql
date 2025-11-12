-- Add coordinator_id column to classes table
ALTER TABLE public.classes
ADD COLUMN coordinator_id uuid REFERENCES auth.users(id);

-- Update RLS policy to include coordinators viewing their managed classes
DROP POLICY IF EXISTS "Hierarchical view classes" ON public.classes;

CREATE POLICY "Hierarchical view classes" ON public.classes
FOR SELECT USING (
  auth.uid() = created_by 
  OR auth.uid() = managed_by 
  OR auth.uid() = teacher_id
  OR auth.uid() = coordinator_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'director'::app_role)
  OR has_role(auth.uid(), 'coordinator'::app_role)
  OR EXISTS (
    SELECT 1 FROM parent_student_links psl
    JOIN students s ON s.id = psl.student_id
    WHERE psl.parent_id = auth.uid()
    AND s.class_id = classes.id
  )
);