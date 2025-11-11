-- Add teacher_id column to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id);

-- Update the view policy to include teacher_id
DROP POLICY IF EXISTS "Hierarchical view classes" ON classes;

CREATE POLICY "Hierarchical view classes" ON classes
FOR SELECT
USING (
  -- Creator can see their classes
  auth.uid() = created_by 
  OR 
  -- Manager can see managed classes
  auth.uid() = managed_by 
  OR
  -- Assigned teacher can see their classes
  auth.uid() = teacher_id
  OR 
  -- Admin, director, coordinator can see all classes
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  has_role(auth.uid(), 'director'::app_role) 
  OR 
  has_role(auth.uid(), 'coordinator'::app_role)
  OR
  -- Parents can see classes where their children are enrolled
  EXISTS (
    SELECT 1
    FROM parent_student_links psl
    JOIN students s ON s.id = psl.student_id
    WHERE psl.parent_id = auth.uid() 
    AND s.class_id = classes.id
  )
);