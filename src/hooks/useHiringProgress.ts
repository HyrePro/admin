import { useQuery } from '@tanstack/react-query';
import { hiringProgressQueryOptions } from '@/lib/query/fetchers/dashboard';

export function useHiringProgress(schoolId: string) {
  return useQuery(hiringProgressQueryOptions(schoolId));
}
