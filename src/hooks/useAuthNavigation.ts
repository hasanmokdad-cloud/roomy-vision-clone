import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for navigating users to login. Opens the global auth modal on listings page.
 * Use this instead of navigate('/auth') to ensure consistent auth flow.
 */
export function useAuthNavigation() {
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();

  /**
   * Redirects to listings page and opens the global auth modal
   */
  const redirectToLogin = () => {
    navigate('/listings');
    // Small delay to ensure navigation completes before opening modal
    setTimeout(() => {
      openAuthModal();
    }, 100);
  };

  /**
   * Opens the auth modal without navigation (for use when already on a page with auth context)
   */
  const showLogin = () => {
    openAuthModal();
  };

  return {
    redirectToLogin,
    showLogin,
    openAuthModal
  };
}
