import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';

interface AuthState {
  user: any | null;
  loading: boolean;
}

export function useAuthWithFallback(): AuthState {
  try {
    // Try to use the regular useAuth hook first
    return useAuth();
  } catch (error) {
    // If the hook fails because it's not within an AuthProvider, 
    // fetch the session directly from Supabase
    const [authState, setAuthState] = useState<AuthState>({ 
      user: null, 
      loading: true 
    });

    useEffect(() => {
      const checkSession = async () => {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          setAuthState({
            user: session?.user || null,
            loading: false
          });
        } catch (err) {
          console.error('Error checking session:', err);
          setAuthState({
            user: null,
            loading: false
          });
        }
      };

      checkSession();
    }, []);

    return authState;
  }
}