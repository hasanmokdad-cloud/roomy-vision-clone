-- Add new columns to notification_preferences for extended notification settings
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS show_message_previews BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS play_sound_incoming BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS play_sound_outgoing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_reaction_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS background_sync BOOLEAN DEFAULT true;

-- Create chat_settings table for theme, wallpaper, and chat preferences
CREATE TABLE IF NOT EXISTS chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system',
  chat_wallpaper TEXT DEFAULT 'default',
  spell_check BOOLEAN DEFAULT true,
  replace_text_with_emoji BOOLEAN DEFAULT true,
  enter_is_send BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_settings
CREATE POLICY "Users can view own chat settings" ON chat_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat settings" ON chat_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat settings" ON chat_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_chat_settings_updated_at
  BEFORE UPDATE ON chat_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();