'use client';

import { AuthProvider } from '@/context/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  // Create a single instance of QueryClient for the entire app
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: true, // Refetch on window focus
        refetchOnReconnect: true, // Refetch on network reconnect
        retry: 2, // Retry failed queries twice
        retryDelay: (attemptIndex) => {
          // Exponential backoff: 1s, 2s, 4s, etc.
          return Math.min(1000 * 2 ** attemptIndex, 30000);
        },
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}