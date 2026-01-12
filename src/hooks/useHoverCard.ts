import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { 
  fetchHoverCardData, 
  HoverEntity, 
  HoverInfo,
  JobHoverInfo as JobHoverInfoType,
  CandidateHoverInfo as CandidateHoverInfoType,
  AdminUserHoverInfo as AdminUserHoverInfoType
} from '@/lib/supabase/api/hover-card';

// Export the types for external use
export type { JobHoverInfoType, CandidateHoverInfoType, AdminUserHoverInfoType };

// Create aliases for convenience
export type JobHoverInfo = JobHoverInfoType;
export type CandidateHoverInfo = CandidateHoverInfoType;
export type AdminUserHoverInfo = AdminUserHoverInfoType;

// Define query keys for hover card data
const HOVER_CARD_QUERY_KEYS = {
  base: ['hover-card'] as const,
  entity: (entity: HoverEntity, entityId: string) => [...HOVER_CARD_QUERY_KEYS.base, entity, entityId] as const,
} as const;

// Type predicate functions to narrow down the type
function isJobHoverInfo(data: HoverInfo): data is JobHoverInfo {
  return (data as JobHoverInfo).total_applications !== undefined;
}

function isCandidateHoverInfo(data: HoverInfo): data is CandidateHoverInfo {
  return (data as CandidateHoverInfo).job_title !== undefined;
}

function isAdminUserHoverInfo(data: HoverInfo): data is AdminUserHoverInfo {
  return (data as AdminUserHoverInfo).role !== undefined;
}

// Generic hook for hover card data
export function useHoverCardData(
  entity: HoverEntity,
  entityId: string,
  options?: Omit<UseQueryOptions<HoverInfo, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<HoverInfo, Error>({
    queryKey: HOVER_CARD_QUERY_KEYS.entity(entity, entityId),
    queryFn: () => fetchHoverCardData(entity, entityId),
    enabled: !!entity && !!entityId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    ...options,
  });
}

// Specific hooks for each entity type
export function useJobHoverData(
  jobId: string,
  options?: Omit<UseQueryOptions<JobHoverInfo, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<JobHoverInfo, Error>({
    queryKey: HOVER_CARD_QUERY_KEYS.entity('job', jobId),
    queryFn: async () => {
      const data = await fetchHoverCardData('job', jobId);
      if (!isJobHoverInfo(data)) {
        throw new Error('Invalid job hover data');
      }
      return data;
    },
    enabled: !!jobId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    ...options,
  });
}

export function useCandidateHoverData(
  candidateId: string,
  options?: Omit<UseQueryOptions<CandidateHoverInfo, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<CandidateHoverInfo, Error>({
    queryKey: HOVER_CARD_QUERY_KEYS.entity('candidate', candidateId),
    queryFn: async () => {
      const data = await fetchHoverCardData('candidate', candidateId);
      if (!isCandidateHoverInfo(data)) {
        throw new Error('Invalid candidate hover data');
      }
      return data;
    },
    enabled: !!candidateId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    ...options,
  });
}

export function useAdminUserHoverData(
  userId: string,
  options?: Omit<UseQueryOptions<AdminUserHoverInfo, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AdminUserHoverInfo, Error>({
    queryKey: HOVER_CARD_QUERY_KEYS.entity('admin', userId),
    queryFn: async () => {
      const data = await fetchHoverCardData('admin', userId);
      if (!isAdminUserHoverInfo(data)) {
        throw new Error('Invalid admin user hover data');
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    ...options,
  });
}