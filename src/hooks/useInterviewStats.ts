import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';

// Define the type for the stats data
interface InterviewStats {
  interview_ready_applications: number;
  total_interviews: number;
  completed_interviews: number;
  scheduled_interviews: number;
  overdue_interviews: number;
}

export const useInterviewStats = (schoolId: string) => {
  const fetchInterviewStats = async (): Promise<InterviewStats> => {
    if (!schoolId) {
      throw new Error('School ID is required to fetch interview stats');
    }

    const response = await fetch(`/api/interview-stats?p_school_id=${schoolId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch interview stats');
    }
    
    const data = await response.json();
    return data;
  };

  return useQuery<InterviewStats, Error>({
    queryKey: ['interview-stats', schoolId],
    queryFn: fetchInterviewStats,
    enabled: !!schoolId, // Only run the query if schoolId is provided
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Garbage collection time
  });
};