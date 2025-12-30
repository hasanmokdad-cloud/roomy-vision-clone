import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

export interface ChatSettings {
  theme: 'light' | 'dark' | 'system';
  chat_wallpaper: string;
  spell_check: boolean;
  replace_text_with_emoji: boolean;
  enter_is_send: boolean;
}

const defaultSettings: ChatSettings = {
  theme: 'system',
  chat_wallpaper: 'default',
  spell_check: true,
  replace_text_with_emoji: true,
  enter_is_send: true,
};

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { userId, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no record exists, create one with defaults
        if (error.code === 'PGRST116') {
          await createDefaultSettings();
          return;
        }
        console.error('Error fetching chat settings:', error);
        return;
      }

      if (data) {
        setSettings({
          theme: data.theme as ChatSettings['theme'],
          chat_wallpaper: data.chat_wallpaper,
          spell_check: data.spell_check,
          replace_text_with_emoji: data.replace_text_with_emoji,
          enter_is_send: data.enter_is_send,
        });
      }
    } catch (error) {
      console.error('Error fetching chat settings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Create default settings for new users
  const createDefaultSettings = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('chat_settings')
        .insert({
          user_id: userId,
          ...defaultSettings,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat settings:', error);
        return;
      }

      if (data) {
        setSettings({
          theme: data.theme as ChatSettings['theme'],
          chat_wallpaper: data.chat_wallpaper,
          spell_check: data.spell_check,
          replace_text_with_emoji: data.replace_text_with_emoji,
          enter_is_send: data.enter_is_send,
        });
      }
    } catch (error) {
      console.error('Error creating chat settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update a single setting
  const updateSetting = async <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    if (!userId) return;

    setSaving(true);
    const previousValue = settings[key];
    
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // If theme is being changed, update next-themes
    if (key === 'theme') {
      setTheme(value as string);
    }

    try {
      const { error } = await supabase
        .from('chat_settings')
        .update({ [key]: value })
        .eq('user_id', userId);

      if (error) {
        // Revert on error
        setSettings(prev => ({ ...prev, [key]: previousValue }));
        if (key === 'theme') {
          setTheme(previousValue as string);
        }
        toast({
          title: 'Error',
          description: 'Failed to save setting. Please try again.',
          variant: 'destructive',
        });
        console.error('Error updating chat setting:', error);
      }
    } catch (error) {
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: previousValue }));
      console.error('Error updating chat setting:', error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, userId, fetchSettings]);

  return {
    settings,
    loading,
    saving,
    updateSetting,
    refetch: fetchSettings,
  };
}
