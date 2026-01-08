import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/api/client';

interface DashboardStats {
  total_applications: number;
  interview_ready: number;
  offered: number;
}

interface JobData {
  id: string;
}

// Define query keys for cache management
const DASHBOARD_QUERY_KEYS = {
  base: ['dashboard'] as const,
  schoolInfo: (userId: string) => [...DASHBOARD_QUERY_KEYS.base, 'schoolInfo', userId] as const,
  jobs: (schoolId: string) => [...DASHBOARD_QUERY_KEYS.base, 'jobs', schoolId] as const,
  stats: (schoolId: string) => [...DASHBOARD_QUERY_KEYS.base, 'stats', schoolId] as const,
  all: (userId: string, schoolId: string) => [
    ...DASHBOARD_QUERY_KEYS.base, 
    'all', 
    userId, 
    schoolId
  ] as const,
};

/**
 * Custom hook to fetch school information for a given user
 */
export function useSchoolInfo(userId: string) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.schoolInfo(userId),
    queryFn: async (): Promise<string | null> => {
      if (!userId) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('admin_user_info')
        .select('school_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.school_id || null;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Custom hook to fetch jobs for a given school
 */
export function useJobs(schoolId: string) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.jobs(schoolId),
    queryFn: async (): Promise<JobData[]> => {
      if (!schoolId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from('jobs')
        .select('id')
        .eq('school_id', schoolId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Custom hook to fetch dashboard statistics for a given school
 */
export function useDashboardStats(schoolId: string) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.stats(schoolId),
    queryFn: async (): Promise<DashboardStats | null> => {
      if (!schoolId) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('get_school_dashboard_stats', { p_school_id: schoolId })
        .single();

      if (error) throw error;
      return data as DashboardStats;
    },
    enabled: !!schoolId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Custom hook for adding a new job optimistically
 */
export function useAddJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ newJob, schoolId }: { newJob: Omit<JobData, 'id'>; schoolId: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('jobs')
        .insert({...newJob, school_id: schoolId}) // Assuming jobs table has a school_id column
        .select('id');

      if (error) throw error;
      return data[0];
    },
    onMutate: async ({ newJob, schoolId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEYS.jobs(schoolId) });
      
      // Snapshot previous values
      const previousJobs = queryClient.getQueryData(DASHBOARD_QUERY_KEYS.jobs(schoolId));
      
      // Optimistically update the cache
      queryClient.setQueryData(DASHBOARD_QUERY_KEYS.jobs(schoolId), (old: JobData[] = []) => [
        ...old,
        { id: 'optimistic-id-placeholder' }, // Will be updated after successful mutation
      ]);
      
      return { previousJobs, schoolId };
    },
    onError: (err, { newJob, schoolId }, context) => {
      // Rollback on error
      if (context?.previousJobs) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEYS.jobs(context.schoolId), context.previousJobs);
      }
    },
    onSuccess: (data, { newJob, schoolId }) => {
      // Update the optimistic ID with the real one
      queryClient.setQueryData(DASHBOARD_QUERY_KEYS.jobs(schoolId), (old: JobData[] = []) => {
        return old.map(job => 
          job.id === 'optimistic-id-placeholder' ? { id: data.id } : job
        );
      });
    },
  });
}

/**
 * Custom hook for updating dashboard stats
 */
export function useUpdateDashboardStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedStats: DashboardStats) => {
      // This would typically call an API endpoint to update stats
      // For now, we'll simulate an update
      return updatedStats;
    },
    onMutate: async (updatedStats) => {
      // Snapshot previous values
      // This is a simplified approach - would need schoolId to update specific stats
      
      return { previousStats: null };
    },
    onError: (err, newStats, context) => {
      // Rollback on error
      // Would restore the previous state here if we had the proper context
    },
    onSuccess: (data, updatedStats) => {
      // Stats are usually calculated server-side, so we might want to refetch
      // Would use the schoolId to invalidate the correct query
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.base });
    },
  });
}

/**
 * Combined hook to fetch all dashboard data
 */
export function useDashboardData(userId: string) {
  const {
    data: schoolId,
    isLoading: isSchoolInfoLoading,
    isError: isSchoolInfoError,
    refetch: refetchSchoolInfo,
  } = useSchoolInfo(userId);

  const {
    data: jobs,
    isLoading: areJobsLoading,
    isError: areJobsError,
    refetch: refetchJobs,
  } = useJobs(schoolId || '');

  const {
    data: dashboardStats,
    isLoading: areStatsLoading,
    isError: areStatsError,
    refetch: refetchStats,
  } = useDashboardStats(schoolId || '');

  const isLoading = isSchoolInfoLoading || areJobsLoading || areStatsLoading;
  const isError = isSchoolInfoError || areJobsError || areStatsError;

  const refetchAll = () => {
    refetchSchoolInfo();
    if (schoolId) {
      refetchJobs();
      refetchStats();
    }
  };

  return {
    schoolId,
    jobs: jobs || [],
    dashboardStats,
    isLoading,
    isError,
    refetchAll,
  };
}