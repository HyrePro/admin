import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { requestDeduplicator, generateRequestKey } from '@/lib/request-deduplicator';
import GlobalErrorHandler from '@/lib/error-handler';

// Define the Job type based on what the API returns
export interface Job {
  id: string;
  title: string;
  status: string;
  subjects: string[];
  grade_levels: string[];
  created_at: string;
  application_analytics: {
    total_applications: number;
    assessment: number;
    demo: number;
    interviews: number;
    offered: number;
  };
  hiring: {
    first_name: string;
    last_name: string;
    avatar: string;
  };
}

interface UseJobsOptions {
  status?: string;
  search?: string;
  startIndex?: number;
  endIndex?: number;
  enabled?: boolean;
}

export function useJobs({
  status = 'ALL',
  search = '',
  startIndex = 0,
  endIndex = 20,
  enabled = true,
}: UseJobsOptions = {}) {
  const queryClient = useQueryClient();

  // Create a unique query key based on the parameters
  const queryKey = useMemo(
    () => ['jobs', status, search, startIndex, endIndex],
    [status, search, startIndex, endIndex]
  );

  const { data, isLoading, error, refetch } = useQuery<Job[]>({
    queryKey,
    queryFn: async () => {
      // Generate a unique request key based on URL and parameters
      const requestKey = generateRequestKey('/api/jobs', {
        status,
        search,
        startIndex,
        endIndex
      }, 'GET');

      // Execute the request with deduplication and throttling
      const response = await requestDeduplicator.execute(requestKey, async () => {
        const queryParams = new URLSearchParams({
          status,
          startIndex: startIndex.toString(),
          endIndex: endIndex.toString(),
        });

        // Add search parameter if provided
        if (search) {
          queryParams.append('search', search);
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add Authorization header if we have an access token
        // This will be handled by the calling component that has access to the session
        // For now, we'll assume authentication is handled by cookies

        return await fetch(`/api/jobs?${queryParams}`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });
      }, 'anonymous', '/api/jobs', 'GET');

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || `Failed to fetch jobs: Server responded with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const jobs = data.jobs || [];
      // Ensure the returned data is serializable
      return JSON.parse(JSON.stringify(jobs));
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
    enabled,
  });

  return {
    jobs: data || [],
    isLoading,
    error,
    refetch,
    // Helper function to prefetch next page
    prefetchNextPage: (nextStartIndex: number, nextEndIndex: number) => {
      queryClient.prefetchQuery({
        queryKey: ['jobs', status, search, nextStartIndex, nextEndIndex],
        queryFn: async () => {
          const requestKey = generateRequestKey('/api/jobs', {
            status,
            search,
            startIndex: nextStartIndex,
            endIndex: nextEndIndex
          }, 'GET');

          const response = await requestDeduplicator.execute(requestKey, async () => {
            const queryParams = new URLSearchParams({
              status,
              startIndex: nextStartIndex.toString(),
              endIndex: nextEndIndex.toString(),
            });

            if (search) {
              queryParams.append('search', search);
            }

            const headers: HeadersInit = {
              'Content-Type': 'application/json',
            };

            return await fetch(`/api/jobs?${queryParams}`, {
              method: 'GET',
              headers,
              credentials: 'include',
            });
          }, 'anonymous', '/api/jobs', 'GET');

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || `Failed to prefetch jobs: Server responded with status ${response.status}`;
            throw new Error(errorMessage);
          }

          const data = await response.json();
          const jobs = data.jobs || [];
          // Ensure the returned data is serializable
          return JSON.parse(JSON.stringify(jobs));
        },
        staleTime: 5 * 60 * 1000,
      });
    },
  };
}