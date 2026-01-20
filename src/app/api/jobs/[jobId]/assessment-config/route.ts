import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/api/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return Response.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_job_assessment_config', {
      p_job_id: jobId,
    });

    if (error) {
      console.error('Error fetching job assessment config:', error);
      return Response.json({ error: error.message || 'Failed to fetch job assessment config' }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: 'Job assessment config not found' }, { status: 404 });
    }

    // Ensure data is properly serialized to avoid non-serializable object errors
    const serializedData = JSON.parse(JSON.stringify(data));

    return Response.json(serializedData);
  } catch (error) {
    console.error('Unexpected error in assessment-config API route:', error);
    return Response.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}