-- Add sound settings columns to chat_settings table
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS notification_sound TEXT DEFAULT 'default';
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS incoming_sound_enabled BOOLEAN DEFAULT true;
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS outgoing_sound_enabled BOOLEAN DEFAULT false;
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS vibration_enabled BOOLEAN DEFAULT true;