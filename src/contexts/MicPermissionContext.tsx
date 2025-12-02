import React, { createContext, useContext, useState, useEffect } from 'react';

type MicPermission = 'granted' | 'prompt' | 'denied';

interface MicPermissionContextType {
  permission: MicPermission;
  isRequesting: boolean;
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  recheckPermission: () => Promise<boolean>;
}

const MicPermissionContext = createContext<MicPermissionContextType | undefined>(undefined);

export const MicPermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permission, setPermission] = useState<MicPermission>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('roomyMicPermission');
    return (stored as MicPermission) || 'prompt';
  });
  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermission = async () => {
    try {
      // Check localStorage first
      const stored = localStorage.getItem('roomyMicPermission');
      if (stored === 'granted') {
        setPermission('granted');
        return;
      }

      // Use Permissions API if available
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        const state = result.state as MicPermission;
        setPermission(state);
        
        if (state === 'granted') {
          localStorage.setItem('roomyMicPermission', 'granted');
        }

        // Listen for permission changes
        result.onchange = () => {
          const newState = result.state as MicPermission;
          setPermission(newState);
          if (newState === 'granted') {
            localStorage.setItem('roomyMicPermission', 'granted');
          } else {
            localStorage.removeItem('roomyMicPermission');
          }
        };
      } else {
        // Fallback for browsers without Permissions API
        setPermission('prompt');
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermission('prompt');
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (isRequesting) return false; // Prevent duplicate requests
    
    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Permission granted - stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      setPermission('granted');
      localStorage.setItem('roomyMicPermission', 'granted');
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermission('denied');
      localStorage.removeItem('roomyMicPermission');
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const recheckPermission = async (): Promise<boolean> => {
    // Force re-check from browser, not localStorage
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermission('granted');
      localStorage.setItem('roomyMicPermission', 'granted');
      return true;
    } catch {
      setPermission('denied');
      localStorage.removeItem('roomyMicPermission');
      return false;
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return (
    <MicPermissionContext.Provider value={{ permission, isRequesting, checkPermission, requestPermission, recheckPermission }}>
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
