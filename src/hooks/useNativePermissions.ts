import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface NativePermissions {
  microphone: PermissionStatus;
  camera: PermissionStatus;
  photos: PermissionStatus;
}

/**
 * Hook to manage native app permissions for Capacitor iOS/Android apps
 * On web, this hook returns 'unknown' for all permissions and no-ops for request functions
 */
export function useNativePermissions() {
  const [permissions, setPermissions] = useState<NativePermissions>({
    microphone: 'unknown',
    camera: 'unknown',
    photos: 'unknown',
  });
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(() => {
    return localStorage.getItem('roomyNativePermissionsShown') === 'true';
  });

  useEffect(() => {
    // Check if running as native app (not web)
    const isNative = Capacitor.isNativePlatform();
    setIsNativeApp(isNative);
    
    if (isNative) {
      checkAllPermissions();
    }
  }, []);

  const checkAllPermissions = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      // On native, we need to use the Permissions API through native plugins
      // For now, we'll check via getUserMedia for mic/camera
      const newPermissions: NativePermissions = {
        microphone: 'prompt',
        camera: 'prompt',
        photos: 'prompt',
      };

      // Check microphone via permissions API if available
      if ('permissions' in navigator) {
        try {
          const micResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          newPermissions.microphone = micResult.state as PermissionStatus;
        } catch {
          // Safari doesn't support this, assume prompt
        }

        try {
          const camResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
          newPermissions.camera = camResult.state as PermissionStatus;
        } catch {
          // Safari doesn't support this, assume prompt
        }
      }

      setPermissions(newPermissions);
    } catch (error) {
      console.error('Error checking native permissions:', error);
    }
  };

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      return true;
    } catch {
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      return false;
    }
  }, []);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      return true;
    } catch {
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      return false;
    }
  }, []);

  const requestPhotoPermission = useCallback(async (): Promise<boolean> => {
    // Photos/media library permission is granted automatically when user picks a file
    // We can't directly request this permission, so we return true
    setPermissions(prev => ({ ...prev, photos: 'granted' }));
    return true;
  }, []);

  const markModalShown = useCallback(() => {
    setHasShownModal(true);
    localStorage.setItem('roomyNativePermissionsShown', 'true');
  }, []);

  const openNativeSettings = useCallback(() => {
    // On native platforms, try to open app settings
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor's App plugin to open settings
      // This requires @capacitor/app to be installed
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { App } = (window as any).Capacitor?.Plugins || {};
        if (App?.openUrl) {
          // iOS: Open app settings
          if (Capacitor.getPlatform() === 'ios') {
            App.openUrl({ url: 'app-settings:' });
          }
          // Android: Open app details settings
          else if (Capacitor.getPlatform() === 'android') {
            App.openUrl({ url: `package:${Capacitor.isNativePlatform() ? 'app.lovable.4d46b2289a2e469ca936ed0640338b2f' : ''}` });
          }
        }
      } catch (error) {
        console.error('Could not open native settings:', error);
      }
    }
  }, []);

  const shouldShowPermissionModal = isNativeApp && !hasShownModal;

  return {
    permissions,
    isNativeApp,
    hasShownModal,
    shouldShowPermissionModal,
    requestMicrophonePermission,
    requestCameraPermission,
    requestPhotoPermission,
    markModalShown,
    openNativeSettings,
    checkAllPermissions,
  };
}
