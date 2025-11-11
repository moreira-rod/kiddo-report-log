-- Drop existing view policy to recreate with teacher support
DROP POLICY IF EXISTS "Hierarchical view classes" ON classes;

-- Create comprehensive view policy for all roles
CREATE POLICY "Hierarchical view classes" ON classes
FOR SELECT
USING (
  -- Creator can see their classes
  auth.uid() = created_by 
  OR 
  -- Manager can see managed classes
  auth.uid() = managed_by 
  OR 
  -- Admin, director, coordinator can see all classes
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  has_role(auth.uid(), 'director'::app_role) 
  OR 
  has_role(auth.uid(), 'coordinator'::app_role)
  OR
  -- Teachers can see classes where they have students
  (
    has_role(auth.uid(), 'teacher'::app_role)
    AND EXISTS (
      SELECT 1 
      FROM students 
      WHERE students.class_id = classes.id 
      AND (students.teacher_id = auth.uid() OR students.created_by = auth.uid())
    )
  )
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