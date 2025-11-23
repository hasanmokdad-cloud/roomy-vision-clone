import { toast } from '@/hooks/use-toast';

export const isRLSError = (error: any): boolean => {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || '';
  return msg.includes('permission denied') || 
         msg.includes('row-level security') || 
         msg.includes('rls') ||
         msg.includes('policy');
};

export const handleSupabaseError = (error: any, context?: string) => {
  console.error(`Supabase error${context ? ` in ${context}` : ''}:`, error);
  
  let message = 'An error occurred. Please try again.';
  let title = 'Error';
  
  if (error.message?.includes('JWT') || error.message?.includes('session')) {
    title = 'Session Issue';
    message = 'Your session may have expired. Please log out and log back in.';
  } else if (isRLSError(error)) {
    title = 'Permission Error';
    message = 'Authentication issue detected. Please log out and log back in to refresh your session.';
  } else if (error.message?.includes('permission')) {
    title = 'Permission Error';
    message = 'You do not have permission to perform this action.';
  } else if (error.message) {
    message = error.message;
  }
  
  toast({
    title,
    description: message,
    variant: 'destructive',
  });
};

export const handleNetworkError = (error: any, context?: string) => {
  console.error(`Network error${context ? ` in ${context}` : ''}:`, error);
  
  toast({
    title: 'Connection Error',
    description: 'Please check your internet connection and try again.',
    variant: 'destructive',
  });
};

export const wrapSupabaseCall = async <T>(
  call: () => Promise<{ data: T; error: any }>,
  context?: string
): Promise<T | null> => {
  try {
    const { data, error } = await call();
    if (error) {
      handleSupabaseError(error, context);
      return null;
    }
    return data;
  } catch (error) {
    handleNetworkError(error, context);
    return null;
  }
};
