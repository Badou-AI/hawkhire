import { useRouter } from 'next/router';
import { useSupabase } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';

const useAuth = () => {
  const router = useRouter();
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(false);

  // Add a function to handle session refresh
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('[useAuth] Session refresh error:', result.error);
        
        if (result.invalidToken) {
          // Handle invalid token by signing out
          await supabase.auth.signOut();
          router.push('/sign-in');
        }
        
        setIsLoading(false);
        return false;
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[useAuth] Unexpected error during session refresh:', error);
      setIsLoading(false);
      return false;
    }
  };

  return { isLoading, refreshSession };
};

export default useAuth; 