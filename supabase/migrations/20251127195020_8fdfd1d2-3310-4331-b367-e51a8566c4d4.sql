-- Add DELETE policy for conversations so all users can delete their own conversations
CREATE POLICY "users_can_delete_own_conversations" ON public.conversations
FOR DELETE TO authenticated
USING (
  (auth.uid() = user_a_id) 
  OR (auth.uid() = user_b_id)
  OR (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
  OR (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ))
);