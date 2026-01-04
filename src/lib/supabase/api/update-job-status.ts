import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UpdateJobStatusResponse {
  success: boolean;
  error?: string;
  job?: any;
}

/**
 * Update job status
 * @param jobId - The ID of the job to update
 * @param newStatus - The new status for the job
 * @returns Promise resolving to UpdateJobStatusResponse
 */
export async function updateJobStatus(
  jobId: string, 
  newStatus: string
): Promise<UpdateJobStatusResponse> {
  try {
    // Validate inputs
    if (!jobId) {
      return { success: false, error: 'Job ID is required' };
    }

    const validStatuses = ['OPEN', 'PAUSED', 'COMPLETED', 'IN_PROGRESS', 'SUSPENDED', 'APPEALED'];
    if (!validStatuses.includes(newStatus.toUpperCase())) {
      return { 
        success: false, 
        error: `Invalid status. Valid values are: ${validStatuses.join(', ')}` 
      };
    }

    // In a real implementation, you would need to authenticate the user
    // and verify they have permission to update this job
    const { data, error } = await supabase
      .from('jobs') // Assuming the jobs table name
      .update({ status: newStatus.toUpperCase() })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, job: data };
  } catch (error) {
    console.error('Unexpected error updating job status:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update multiple job statuses
 * @param jobIds - Array of job IDs to update
 * @param newStatus - The new status for the jobs
 * @returns Promise resolving to UpdateJobStatusResponse
 */
export async function updateMultipleJobStatuses(
  jobIds: string[], 
  newStatus: string
): Promise<UpdateJobStatusResponse> {
  try {
    // Validate inputs
    if (!jobIds || jobIds.length === 0) {
      return { success: false, error: 'At least one job ID is required' };
    }

    const validStatuses = ['OPEN', 'PAUSED', 'COMPLETED', 'IN_PROGRESS', 'SUSPENDED', 'APPEALED'];
    if (!validStatuses.includes(newStatus.toUpperCase())) {
      return { 
        success: false, 
        error: `Invalid status. Valid values are: ${validStatuses.join(', ')}` 
      };
    }

    // In a real implementation, you would need to authenticate the user
    // and verify they have permission to update these jobs
    const { data, error } = await supabase
      .from('jobs') // Assuming the jobs table name
      .update({ status: newStatus.toUpperCase() })
      .in('id', jobIds);

    if (error) {
      console.error('Error updating multiple job statuses:', error);
      return { success: false, error: error.message };
    }

    return { success: true, job: data };
  } catch (error) {
    console.error('Unexpected error updating multiple job statuses:', error);
    return { success: false, error: (error as Error).message };
  }
}