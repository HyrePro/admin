import { useQuery } from '@tanstack/react-query';
import { getHiringProgress } from '@/lib/supabase/api/get-hiring-progress';
import { HiringProgressData } from '@/components/hiring-progress-chart';

// Define query keys for cache management
const HIRING_PROGRESS_QUERY_KEYS = {
  base: ['hiring-progress'] as const,
  bySchool: (schoolId: string) => [...HIRING_PROGRESS_QUERY_KEYS.base, schoolId] as const,
} as const;

/**
 * Custom hook to fetch hiring progress data for a given school using TanStack Query
 */
export function useHiringProgress(schoolId: string) {
  return useQuery<HiringProgressData>({
    queryKey: HIRING_PROGRESS_QUERY_KEYS.bySchool(schoolId),
    queryFn: async (): Promise<HiringProgressData> => {
      if (!schoolId) {
        return {
          candidates_screened: 0,
          shortlisted_for_interview: 0,
          interviews_completed: 0,
          offers_extended: 0
        };
      }
      
      return getHiringProgress(schoolId);
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