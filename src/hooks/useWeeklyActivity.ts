import { useQuery } from '@tanstack/react-query';
import { weeklyActivityQueryOptions } from '@/lib/query/fetchers/dashboard';

export function useWeeklyActivity(schoolId: string) {
  return useQuery(weeklyActivityQueryOptions(schoolId));
}
