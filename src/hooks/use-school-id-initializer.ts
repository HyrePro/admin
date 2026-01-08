'use client'

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/api/client';

/**
 * Custom hook to initialize schoolId in the auth store as soon as user is available
 * This ensures schoolId is populated immediately after authentication, not just in protected routes
 */
export function useSchoolIdInitializer() {
  const { user, loading } = useAuth();
  const { setSchoolId } = useAuthStore();

  useEffect(() => {
    if (!loading && user) {
      fetchAndSetSchoolId();
    } else if (!user) {
      // Clear schoolId if user logs out
      setSchoolId(null);
    }
  }, [user, loading, setSchoolId]);

  const fetchAndSetSchoolId = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('admin_user_info')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching school info for initialization:', error);
        setSchoolId(null);
        return;
      }

      const fetchedSchoolId = data?.school_id || null;
      setSchoolId(fetchedSchoolId);
    } catch (error) {
      console.error('Unexpected error during school ID initialization:', error);
      setSchoolId(null);
    }
  };
}