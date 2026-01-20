import { useQuery } from '@tanstack/react-query';
import { getSchoolJobs } from '@/lib/supabase/api/get-school-jobs';

// Define query keys for cache management
const SCHOOL_JOBS_QUERY_KEYS = {
  base: ['school-jobs'] as const,
  bySchool: (schoolId: string) => [...SCHOOL_JOBS_QUERY_KEYS.base, schoolId] as const,
} as const;

/**
 * Custom hook to fetch jobs for a given school using TanStack Query
 */
export function useSchoolJobs(schoolId: string) {
  return useQuery({
    queryKey: SCHOOL_JOBS_QUERY_KEYS.bySchool(schoolId),
    queryFn: async (): Promise<any[]> => {
      if (!schoolId) return [];
      
      return getSchoolJobs(schoolId);
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true, // Refetch on window focus
    refetchOnReconnect: true, // Refetch on network reconnect
    retry: 2, // Retry failed queries twice
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, etc.
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
  });
}