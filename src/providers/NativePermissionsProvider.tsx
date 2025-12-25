import { useState, useEffect } from 'react';
import { NativePermissionsModal } from '@/components/permissions/NativePermissionsModal';
import { useNativePermissions } from '@/hooks/useNativePermissions';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Provider that shows native permissions modal on first app launch after login
 * Only shows on native Capacitor apps (iOS/Android), not on web
 */
export function NativePermissionsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const { shouldShowPermissionModal, isNativeApp } = useNativePermissions();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only show modal when:
    // 1. Running as native app (not web)
    // 2. User is authenticated
    // 3. Haven't shown this modal before for this user
    if (isAuthReady && isAuthenticated && isNativeApp && shouldShowPermissionModal) {
      // Small delay to let the app settle after login
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthReady, isAuthenticated, isNativeApp, shouldShowPermissionModal]);

  const handleComplete = () => {
    setShowModal(false);
  };

  return (
    <>
      {children}
      <NativePermissionsModal open={showModal} onComplete={handleComplete} />
    </>
  );
}
