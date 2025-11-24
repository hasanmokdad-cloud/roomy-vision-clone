-- Migration: Full SaaS Contact Form System
-- Add user_id to contact_messages for linking authenticated users
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.contact_messages(user_id);

-- Make conversations.owner_id nullable for admin support conversations
ALTER TABLE public.conversations 
ALTER COLUMN owner_id DROP NOT NULL;

-- Add conversation_type to distinguish support vs dorm conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS conversation_type text DEFAULT 'dorm' CHECK (conversation_type IN ('dorm', 'support'));

CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(conversation_type);

-- RLS Policy: Admins can view all support conversations
DROP POLICY IF EXISTS "admins_view_all_conversations" ON public.conversations;
CREATE POLICY "admins_view_all_conversations"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  )
);

-- RLS Policy: Students can view their own support conversations
DROP POLICY IF EXISTS "students_view_support_conversations" ON public.conversations;
CREATE POLICY "students_view_support_conversations"
ON public.conversations
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  AND conversation_type = 'support'
);

-- RLS Policy: Admins can insert support conversations
DROP POLICY IF EXISTS "admins_insert_support_conversations" ON public.conversations;
CREATE POLICY "admins_insert_support_conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  conversation_type = 'support' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'student')
  )
);