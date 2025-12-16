import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  push_enabled: boolean;
  notify_tours: boolean;
  notify_messages: boolean;
  notify_reservations: boolean;
  notify_social: boolean;
  notify_promotions: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  notify_tours: true,
  notify_messages: true,
  notify_reservations: true,
  notify_social: true,
  notify_promotions: false,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch preferences from database
  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no record exists, create one with defaults
        if (error.code === 'PGRST116') {
          await createDefaultPreferences();
          return;
        }
        console.error('Error fetching notification preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          push_enabled: data.push_enabled,
          notify_tours: data.notify_tours,
          notify_messages: data.notify_messages,
          notify_reservations: data.notify_reservations,
          notify_social: data.notify_social,
          notify_promotions: data.notify_promotions,
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create default preferences for new users
  const createDefaultPreferences = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          ...defaultPreferences,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          push_enabled: data.push_enabled,
          notify_tours: data.notify_tours,
          notify_messages: data.notify_messages,
          notify_reservations: data.notify_reservations,
          notify_social: data.notify_social,
          notify_promotions: data.notify_promotions,
        });
      }
    } catch (error) {
      console.error('Error creating notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update a single preference
  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user?.id) return;

    setSaving(true);
    const previousValue = preferences[key];
    
    // Optimistic update
    setPreferences(prev => ({ ...prev, [key]: value }));

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) {
        // Revert on error
        setPreferences(prev => ({ ...prev, [key]: previousValue }));
        toast({
          title: 'Error',
          description: 'Failed to save preference. Please try again.',
          variant: 'destructive',
        });
        console.error('Error updating notification preference:', error);
      }
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: previousValue }));
      console.error('Error updating notification preference:', error);
    } finally {
      setSaving(false);
    }
  };

  // Update all preferences at once
  const updateAllPreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return;

    setSaving(true);
    const previousPreferences = { ...preferences };
    
    // Optimistic update
    setPreferences(prev => ({ ...prev, ...newPreferences }));

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(newPreferences)
        .eq('user_id', user.id);

      if (error) {
        // Revert on error
        setPreferences(previousPreferences);
        toast({
          title: 'Error',
          description: 'Failed to save preferences. Please try again.',
          variant: 'destructive',
        });
        console.error('Error updating notification preferences:', error);
      }
    } catch (error) {
      // Revert on error
      setPreferences(previousPreferences);
      console.error('Error updating notification preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchPreferences();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchPreferences]);

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    updateAllPreferences,
    refetch: fetchPreferences,
  };
}
