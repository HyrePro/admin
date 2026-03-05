import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';

interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
}

export function useAuthWithFallback(): AuthState {
  try {
    // Try to use the regular useAuth hook first
    const auth = useAuth();
    return {
      ...auth,
      error: null,
    };
  } catch (error) {
    // If the hook fails because it's not within an AuthProvider, 
    // fetch the session directly from Supabase
    const [authState, setAuthState] = useState<AuthState>({ 
      user: null, 
      loading: true,
      error: null,
    });

    useEffect(() => {
      let isMounted = true;

      const checkSession = async () => {
        try {
          const supabase = createClient();
          const result = await withTimeout(
            supabase.auth.getSession(),
            8_000,
            "AUTH_BOOTSTRAP_TIMEOUT"
          );

          if (!isMounted) return;
          const { data: { session } } = result;
          
          setAuthState({
            user: session?.user || null,
            loading: false,
            error: null,
          });
        } catch (err) {
          console.error('Error checking session:', err);
          if (!isMounted) return;
          setAuthState({
            user: null,
            loading: false,
            error: getAuthBootstrapErrorMessage(err),
          });
        }
      };

      void checkSession();

      return () => {
        isMounted = false;
      };
    }, []);

    return authState;
  }
}

function getAuthBootstrapErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (
    message.includes("AUTH_BOOTSTRAP_TIMEOUT") ||
    message.includes("fetch failed") ||
    message.includes("Connect Timeout") ||
    message.includes("UND_ERR_CONNECT_TIMEOUT")
  ) {
    return "Unable to connect to Supabase right now. Login is temporarily unavailable. Please try again in a few minutes.";
  }

  return "Unable to verify login session right now. Please refresh and try again.";
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutCode: string
): Promise<T> {
  let timeoutId: number | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutCode));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId != null) {
      window.clearTimeout(timeoutId);
    }
  }
}
