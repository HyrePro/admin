'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/api/client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("User authenticated, redirecting to dashboard");
          // Only redirect authenticated users to dashboard
          window.location.href = '/(dashboard)';
        } else {
          console.log("No authenticated user found");
          window.location.href='/login'
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };
    checkAuth();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center text-2xl font-bold">
      Welcome to HyrePro Admin
    </main>
  );
}
