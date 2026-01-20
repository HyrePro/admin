import { useQuery } from '@tanstack/react-query';
import { getWeeklyActivity } from '@/lib/supabase/api/get-weekly-activity';
import { AnalyticsData } from '@/components/weekly-activity-chart';

// Define query keys for cache management
const WEEKLY_ACTIVITY_QUERY_KEYS = {
  base: ['weekly-activity'] as const,
  bySchool: (schoolId: string) => [...WEEKLY_ACTIVITY_QUERY_KEYS.base, schoolId] as const,
} as const;

/**
 * Custom hook to fetch weekly activity data for a given school using TanStack Query
 */
export function useWeeklyActivity(schoolId: string) {
  return useQuery<AnalyticsData[]>({
    queryKey: WEEKLY_ACTIVITY_QUERY_KEYS.bySchool(schoolId),
    queryFn: async (): Promise<AnalyticsData[]> => {
      if (!schoolId) return [];
      
      return getWeeklyActivity(schoolId);
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