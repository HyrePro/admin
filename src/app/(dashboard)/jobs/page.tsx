"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { JobsTable } from "@/components/jobs-table";
import ErrorBoundary from "@/components/error-boundary";
import { retryWithBackoff, isNetworkError } from "@/lib/utils";
import GlobalErrorHandler from "@/lib/error-handler";
import { useQuery } from '@tanstack/react-query';
import { sanitizeJobList } from '@/lib/sanitize';
import { isValidAuthState, validateSessionIntegrity, refreshAuthTokenIfNeeded } from '@/lib/auth-validation';
import { Job } from '@/types/jobs-table';
import { requestDeduplicator, generateRequestKey } from "@/lib/request-deduplicator";
import { useJobs } from "@/hooks/useJobs";
import { useOptimisticJobs } from "@/hooks/useOptimisticJobs";
import '@/styles/jobs.css'





export default function JobsPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();

  const [totalJobsCount, setTotalJobsCount] = useState<number>(0);
  
  const { data: jobs, isLoading: loading, error, refetch } = useQuery<Job[]>({
    queryKey: ['jobs', 'ALL', 0, 20],
    queryFn: async (): Promise<Job[]> => {
      // Validate authentication state
      if (!isValidAuthState(user, session) || !validateSessionIntegrity(session)) {
        throw new Error("Authentication required: Please log in to view job listings");
      }
      
      // Refresh token if needed
      const updatedSession = await refreshAuthTokenIfNeeded(session);
      if (updatedSession) {
        // Update session if refresh was successful
        // In a real implementation, you'd update the session in context
      } else if (!session) {
        // If refresh failed and we don't have a session, throw error
        throw new Error("Authentication required: Please log in to view job listings");
      }
      
      try {
        const queryParams = new URLSearchParams({
          status: "ALL",
          startIndex: '0',
          endIndex: '20'
        });

        // Generate a unique request key based on URL and parameters
        const requestKey = generateRequestKey('/api/jobs', {
          status: "ALL",
          startIndex: '0',
          endIndex: '20'
        }, 'GET');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add Authorization header if we have an access token
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        // Execute the request with deduplication and throttling
        const response = await requestDeduplicator.execute(requestKey, async () => {
          return await fetch(`/api/jobs?${queryParams}`, {
            method: 'GET',
            headers,
            credentials: 'include', // Include cookies for server-side auth
          });
        }, user?.id || 'anonymous', '/api/jobs', 'GET');

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to fetch jobs: Server responded with status ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const jobs = data.jobs || [];
        const sanitizedJobs = sanitizeJobList(jobs);
        // Ensure the returned data is serializable
        return JSON.parse(JSON.stringify(sanitizedJobs));
      } catch (err) {
        // Use global error handler
        const context = {
          operation: 'fetchJobs',
          component: 'JobsPage',
          url: '/api/jobs',
          method: 'GET',
        };
        
        GlobalErrorHandler.logError(err, context);
        throw err; // Re-throw to be handled by React Query
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
    enabled: !!user && !!session, // Only run query when user is authenticated
  });



  const fetchTotalJobCount = async () => {
    // Validate authentication state
    if (!isValidAuthState(user, session) || !validateSessionIntegrity(session)) {
      return;
    }
    
    // Refresh token if needed
    const updatedSession = await refreshAuthTokenIfNeeded(session);
    if (!updatedSession && !session) {
      return; // Not authenticated
    }

    try {
      // Wrap the fetch operation with retry logic
      const fetchTotalCountWithRetry = async () => {
        // Generate a unique request key for the total job count API
        const requestKey = generateRequestKey('/api/get-total-job-count', {}, 'GET');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add Authorization header if we have an access token
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        // Execute the request with deduplication and throttling
        const response = await requestDeduplicator.execute(requestKey, async () => {
          return await fetch(`/api/get-total-job-count`, {
            method: 'GET',
            headers,
            credentials: 'include', // Include cookies for server-side auth
          });
        }, user?.id || 'anonymous', '/api/get-total-job-count', 'GET');

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to fetch total job count: Server responded with status ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setTotalJobsCount(data.totalJobs || 0);
      };

      // Execute the fetch with retry logic
      await retryWithBackoff(fetchTotalCountWithRetry, 3, 1000, 2);
    } catch (err) {
      // Use global error handler
      const context = {
        operation: 'fetchTotalJobCount',
        component: 'JobsPage',
        url: '/api/get-total-job-count',
        method: 'GET',
      };
      
      GlobalErrorHandler.handleApiError(err, context);
    }
  };

  useEffect(() => {
    if (!authLoading && user && session) {
      fetchTotalJobCount();
    }
  }, [user, session, authLoading]);

  return (
    <div className="jobs-container flex flex-col h-full">
      <div className="jobs-header">
        <h1 className="jobs-title">Jobs</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/jobs/create-job-post')}
          className='btn-create'
        >
          <Plus className="btn-icon" />
          Create New Job Post
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <JobsTable 
            jobs={jobs ? JSON.parse(JSON.stringify(jobs || [])) : []} 
            originalJobs={jobs ? JSON.parse(JSON.stringify(jobs || [])) : []}
            totalJobsCount={totalJobsCount}
            loading={loading} 
            onRefresh={() => refetch()} 
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}