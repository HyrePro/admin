'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/api/server';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseServer.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center text-2xl font-bold">
      Loading...
    </main>
  );
}
