import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/api/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return Response.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_job_with_analytics', {
      p_job_id: jobId,
    });

    if (error) {
      console.error('Error fetching job with analytics:', error);
      return Response.json({ error: error.message || 'Failed to fetch job details' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Ensure job data is properly serialized to avoid non-serializable object errors
    const serializedJob = JSON.parse(JSON.stringify(data[0]));

    return Response.json(serializedJob);
  } catch (error) {
    console.error('Unexpected error in job-with-analytics API route:', error);
    return Response.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}