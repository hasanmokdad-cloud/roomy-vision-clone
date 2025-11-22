import { toast } from '@/hooks/use-toast';

export const handleSupabaseError = (error: any, context?: string) => {
  console.error(`Supabase error${context ? ` in ${context}` : ''}:`, error);
  
  let message = 'An error occurred. Please try again.';
  
  if (error.message?.includes('JWT')) {
    message = 'Session expired. Please sign in again.';
  } else if (error.message?.includes('permission')) {
    message = 'You do not have permission to perform this action.';
  } else if (error.message) {
    message = error.message;
  }
  
  toast({
    title: 'Error',
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
