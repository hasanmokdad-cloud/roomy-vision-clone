-- Fix security linter warnings for messaging system

-- Set search_path for all new functions
ALTER FUNCTION set_message_receiver() SET search_path = public;
ALTER FUNCTION get_or_create_conversation(UUID, UUID) SET search_path = public;
ALTER FUNCTION get_support_admin_id() SET search_path = public;