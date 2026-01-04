import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Job } from './useJobs'; // Import the Job type from our useJobs hook

export function useOptimisticJobs() {
  const queryClient = useQueryClient();
  
  // Optimistic update for job status change
  const updateJobStatusOptimistically = useCallback(async (
    jobId: string, 
    newStatus: string,
    updateJobStatusApi: (jobId: string, newStatus: string) => Promise<any>
  ) => {
    // Get the current jobs data from the cache
    const previousJobsData = queryClient.getQueryData<Job[]>(['jobs']);
    
    if (previousJobsData) {
      // Create an optimistic update by updating the job status in the cached data
      const updatedJobs = previousJobsData.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      );
      
      // Update the cache optimistically
      queryClient.setQueryData(['jobs'], updatedJobs);
      
      try {
        // Perform the actual API call
        await updateJobStatusApi(jobId, newStatus);
        
        // The data is already updated in cache, so we're done
        return { success: true };
      } catch (error) {
        // If the API call fails, rollback to the previous state
        queryClient.setQueryData(['jobs'], previousJobsData);
        console.error('Failed to update job status:', error);
        throw error;
      }
    }
    
    // If there's no cached data, just perform the API call normally
    return updateJobStatusApi(jobId, newStatus);
  }, [queryClient]);
  
  // Optimistic update for job title change
  const updateJobTitleOptimistically = useCallback(async (
    jobId: string, 
    newTitle: string,
    updateJobTitleApi: (jobId: string, newTitle: string) => Promise<any>
  ) => {
    // Get the current jobs data from the cache
    const previousJobsData = queryClient.getQueryData<Job[]>(['jobs']);
    
    if (previousJobsData) {
      // Create an optimistic update by updating the job title in the cached data
      const updatedJobs = previousJobsData.map(job => 
        job.id === jobId ? { ...job, title: newTitle } : job
      );
      
      // Update the cache optimistically
      queryClient.setQueryData(['jobs'], updatedJobs);
      
      try {
        // Perform the actual API call
        await updateJobTitleApi(jobId, newTitle);
        
        // The data is already updated in cache, so we're done
        return { success: true };
      } catch (error) {
        // If the API call fails, rollback to the previous state
        queryClient.setQueryData(['jobs'], previousJobsData);
        console.error('Failed to update job title:', error);
        throw error;
      }
    }
    
    // If there's no cached data, just perform the API call normally
    return updateJobTitleApi(jobId, newTitle);
  }, [queryClient]);
  
  // Optimistic update for bulk job status changes
  const updateMultipleJobStatusesOptimistically = useCallback(async (
    jobIds: string[], 
    newStatus: string,
    updateMultipleJobsApi: (jobIds: string[], newStatus: string) => Promise<any>
  ) => {
    // Get the current jobs data from the cache
    const previousJobsData = queryClient.getQueryData<Job[]>(['jobs']);
    
    if (previousJobsData) {
      // Create an optimistic update by updating the job statuses in the cached data
      const updatedJobs = previousJobsData.map(job => 
        jobIds.includes(job.id) ? { ...job, status: newStatus } : job
      );
      
      // Update the cache optimistically
      queryClient.setQueryData(['jobs'], updatedJobs);
      
      try {
        // Perform the actual API call
        await updateMultipleJobsApi(jobIds, newStatus);
        
        // The data is already updated in cache, so we're done
        return { success: true };
      } catch (error) {
        // If the API call fails, rollback to the previous state
        queryClient.setQueryData(['jobs'], previousJobsData);
        console.error('Failed to update multiple job statuses:', error);
        throw error;
      }
    }
    
    // If there's no cached data, just perform the API call normally
    return updateMultipleJobsApi(jobIds, newStatus);
  }, [queryClient]);
  
  return {
    updateJobStatusOptimistically,
    updateJobTitleOptimistically,
    updateMultipleJobStatusesOptimistically,
  };
}