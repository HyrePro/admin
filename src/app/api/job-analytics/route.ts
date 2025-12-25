import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const type = searchParams.get('type') || 'overview';

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  if (!['overview', 'funnel'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type parameter. Valid values are: overview, funnel' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    
    // Fetch the job analytics directly using the Supabase function
    const { data: analyticsData, error: analyticsError } = await supabase
      .rpc('get_job_analytics', {
        p_job_id: jobId,
        p_type: type
      });

    if (analyticsError) {
      console.error(`Error fetching job analytics:`, analyticsError);
      return NextResponse.json({ error: 'Failed to fetch job analytics' }, { status: 500 });
    }

    if (!analyticsData || (Array.isArray(analyticsData) && analyticsData.length === 0) || (!Array.isArray(analyticsData) && !analyticsData)) {
      return NextResponse.json({ error: 'Job analytics not found' }, { status: 404 });
    }

    // Handle both array and single object responses from RPC
    const analytics = Array.isArray(analyticsData) ? analyticsData[0] : analyticsData;
    console.log('API - Raw analytics data from RPC:', analyticsData);
    console.log('API - Selected analytics object:', analytics);

    // Format the response based on the requested type
    if (type === 'overview') {
      // Use the analytics object directly as it contains the correct structure
      const overviewResponse = {
        type: analytics?.type || 'overview',
        job_id: analytics?.job_id || jobId,
        generated_at: analytics?.generated_at || new Date().toISOString(),
        demos_completed: analytics?.demos_completed || 0,
        total_applicants: analytics?.total_applicants || 0,
        assessment_completed: analytics?.assessment_completed || 0,
        interviews_completed: analytics?.interviews_completed || 0
      };
      
      console.log('API - Overview response being returned:', overviewResponse);
      return NextResponse.json(overviewResponse);
    } else { // funnel
      // Use the analytics object directly as it contains the correct funnel structure
      const funnelResponse = {
        type: analytics?.type || 'funnel',
        job_id: analytics?.job_id || jobId,
        stages: {
          hired: analytics?.stages?.hired || 0,
          appealed: analytics?.stages?.appealed || 0,
          rejected: analytics?.stages?.rejected || 0,
          suspended: analytics?.stages?.suspended || 0,
          demo_failed: analytics?.stages?.demo_failed || 0,
          demo_passed: analytics?.stages?.demo_passed || 0,
          demo_submitted: analytics?.stages?.demo_submitted || 0,
          offers_extended: analytics?.stages?.offers_extended || 0,
          assessment_failed: analytics?.stages?.assessment_failed || 0,
          assessment_passed: analytics?.stages?.assessment_passed || 0,
          assessment_started: analytics?.stages?.assessment_started || 0,
          interview_completed: analytics?.stages?.interview_completed || 0,
          interview_scheduled: analytics?.stages?.interview_scheduled || 0,
          applications_submitted: analytics?.stages?.applications_submitted || 0,
        },
        generated_at: analytics?.generated_at || new Date().toISOString(),
        conversion_rates: {
          hire_rate: analytics?.conversion_rates?.hire_rate || 0,
          offer_rate: analytics?.conversion_rates?.offer_rate || 0,
          demo_pass_rate: analytics?.conversion_rates?.demo_pass_rate || 0,
          assessment_pass_rate: analytics?.conversion_rates?.assessment_pass_rate || 0,
          demo_submission_rate: analytics?.conversion_rates?.demo_submission_rate || 0,
          interview_conversion: analytics?.conversion_rates?.interview_conversion || 0,
          application_to_assessment: analytics?.conversion_rates?.application_to_assessment || 0,
        },
        total_applicants: analytics?.total_applicants || 0
      };
      
      console.log('API - Funnel response being returned:', funnelResponse);
      return NextResponse.json(funnelResponse);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}