'use client';

import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/sonner';
import { useSchoolIdInitializer } from '@/hooks/use-school-id-initializer';
import { useAuthStore } from '@/store/auth-store';
import React, { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { QueryProvider } from '@/components/providers/query-provider';
import { SWRProvider } from '@/components/providers/swr-provider';
import { PostHogProviderWrapper } from '@/components/providers/posthog-provider';

// Component wrapper for the school ID initializer hook
function SchoolIdInitializerComponent() {
  useSchoolIdInitializer();
  return null;
}

function InitialAuthHydrator({
  initialUser,
  initialSchoolId,
}: {
  initialUser: User | null;
  initialSchoolId: string | null;
}) {
  const { setUser, setSchoolId } = useAuthStore();

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
    if (initialSchoolId) {
      setSchoolId(initialSchoolId);
    }
  }, [initialUser, initialSchoolId, setUser, setSchoolId]);

  return null;
}

export function AuthProviderWrapper({
  children,
  initialUser = null,
  initialSchoolId = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
  initialSchoolId?: string | null;
}) {
  return (
    <SWRProvider>
      <QueryProvider>
        <PostHogProviderWrapper>
          <AuthProvider initialUser={initialUser}>
            <InitialAuthHydrator initialUser={initialUser} initialSchoolId={initialSchoolId} />
            <SchoolIdInitializerComponent />
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </PostHogProviderWrapper>
      </QueryProvider>
    </SWRProvider>
  );
}
