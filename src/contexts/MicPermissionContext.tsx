import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type MicPermission = 'granted' | 'prompt' | 'denied';

interface MicPermissionContextType {
  permission: MicPermission;
  isRequesting: boolean;
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  recheckPermission: () => Promise<boolean>;
  syncToDatabase: (userId: string, permissionValue?: MicPermission) => Promise<void>;
  loadFromDatabase: (userId: string) => Promise<boolean>;
}

const MicPermissionContext = createContext<MicPermissionContextType | undefined>(undefined);

const STORAGE_KEY = 'roomyMicPermission';
const SESSION_VERIFIED_KEY = 'roomyMicPermissionSessionVerified';

// Detect Safari browser - Safari's Permissions API is unreliable for microphone
const isSafari = typeof navigator !== 'undefined' && 
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const MicPermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permission, setPermission] = useState<MicPermission>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    // On Safari, only trust 'granted' if verified THIS session
    if (isSafari) {
      const sessionVerified = sessionStorage.getItem(SESSION_VERIFIED_KEY);
      if (stored === 'granted' && sessionVerified === 'true') {
        return 'granted';
      }
      // Safari: Start with 'prompt' until verified this session
      return 'prompt';
    }
    
    return (stored as MicPermission) || 'prompt';
  });
  const [isRequesting, setIsRequesting] = useState(false);

  // Sync permission status to database
  // IMPORTANT: Pass explicit permissionValue to avoid stale closure issues
  const syncToDatabase = useCallback(async (userId: string, permissionValue?: MicPermission) => {
    if (!userId) return;
    
    // Use explicit value if provided, otherwise use current state
    const valueToSync = permissionValue ?? permission;
    
    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('preferences')
        .eq('user_id', userId)
        .maybeSingle();

      const currentPrefs = (existing?.preferences as Record<string, unknown>) || {};
      const updatedPrefs = { ...currentPrefs, microphonePermission: valueToSync };

      if (existing) {
        await supabase
          .from('user_settings')
          .update({ preferences: updatedPrefs, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_settings')
          .insert({ user_id: userId, preferences: updatedPrefs });
      }
      
      console.log('[MicPermission] Synced to database:', valueToSync);
    } catch (error) {
      console.error('Error syncing mic permission to database:', error);
    }
  }, [permission]);

  // Load permission status from database
  // IMPORTANT: On Safari, we NEVER call getUserMedia here to avoid triggering the popup prematurely
  // We only trust our stored state until user explicitly grants permission via the modal
  // Returns true when loading is complete (for callers to know when to check permission)
  const loadFromDatabase = useCallback(async (userId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('preferences')
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.preferences) {
        const prefs = data.preferences as Record<string, unknown>;
        const dbPermission = prefs.microphonePermission as MicPermission;
        
        if (dbPermission === 'granted') {
          // Trust the database - user previously granted permission
          // Don't call getUserMedia here as it may trigger Safari popup
          setPermission('granted');
          localStorage.setItem(STORAGE_KEY, 'granted');
          // Set sessionStorage so Safari's session-verification passes
          sessionStorage.setItem(SESSION_VERIFIED_KEY, 'true');
        } else if (dbPermission) {
          setPermission(dbPermission);
          localStorage.setItem(STORAGE_KEY, dbPermission);
        }
      }
      return true;
    } catch (error) {
      console.error('Error loading mic permission from database:', error);
      return true; // Still return true so caller knows loading attempted
    }
  }, []);

  // Check browser permission without requesting
  const recheckBrowserPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  };

  const checkPermission = async () => {
    try {
      // First, check our own stored state (most reliable source of truth)
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'granted') {
        setPermission('granted');
        return;
      }

      // On Safari, DON'T trust the Permissions API - it's unreliable for microphone
      // Keep as 'prompt' until user explicitly grants via getUserMedia
      if (isSafari) {
        console.log('[MicPermission] Safari detected - skipping Permissions API, keeping as prompt');
        setPermission('prompt');
        return;
      }

      // On other browsers, try Permissions API as supplementary check
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          const state = result.state as MicPermission;
          setPermission(state);
          
          if (state === 'granted') {
            localStorage.setItem(STORAGE_KEY, 'granted');
          }

          result.onchange = () => {
            const newState = result.state as MicPermission;
            setPermission(newState);
            if (newState === 'granted') {
              localStorage.setItem(STORAGE_KEY, 'granted');
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          };
        } catch {
          setPermission('prompt');
        }
      } else {
        setPermission('prompt');
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermission('prompt');
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (isRequesting) return false;
    
    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setPermission('granted');
      localStorage.setItem(STORAGE_KEY, 'granted');
      // Mark as verified THIS session (Safari-specific but harmless on other browsers)
      sessionStorage.setItem(SESSION_VERIFIED_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermission('denied');
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_VERIFIED_KEY);
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const recheckPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermission('granted');
      localStorage.setItem(STORAGE_KEY, 'granted');
      sessionStorage.setItem(SESSION_VERIFIED_KEY, 'true');
      return true;
    } catch {
      setPermission('denied');
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_VERIFIED_KEY);
      return false;
    }
  };

  // REMOVED: Auto-run of checkPermission on mount
  // This was causing a race condition on Safari where checkPermission() would run
  // before loadFromDatabase() could load the 'granted' status, incorrectly resetting to 'prompt'
  // Now the caller (Messages.tsx) explicitly controls when to check/load permission

  return (
    <MicPermissionContext.Provider value={{ 
      permission, 
      isRequesting, 
      checkPermission, 
      requestPermission, 
      recheckPermission,
      syncToDatabase,
      loadFromDatabase
    }}>
      {children}
    </MicPermissionContext.Provider>
  );
};

export const useMicPermission = () => {
  const context = useContext(MicPermissionContext);
  if (!context) {
    throw new Error('useMicPermission must be used within MicPermissionProvider');
  }
  return context;
};
