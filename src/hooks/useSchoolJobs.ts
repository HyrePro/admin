import { useQuery } from '@tanstack/react-query';
import { schoolJobsQueryOptions } from '@/lib/query/fetchers/dashboard';

export function useSchoolJobs(schoolId: string) {
  return useQuery(schoolJobsQueryOptions(schoolId));
}
