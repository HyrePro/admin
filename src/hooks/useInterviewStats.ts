import { useQuery } from '@tanstack/react-query';
import { interviewStatsQueryOptions } from '@/lib/query/fetchers/interviews';

export const useInterviewStats = (schoolId: string) => {
  return useQuery({
    ...interviewStatsQueryOptions(schoolId),
    placeholderData: (previousData) => previousData,
  });
};
