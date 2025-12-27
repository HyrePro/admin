import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    
    // Fetch the interview analytics using the Supabase function
    const { data: analyticsData, error: analyticsError } = await supabase
      .rpc('get_interview_analytics', {
        p_job_id: jobId,
      });

    if (analyticsError) {
      console.error(`Error fetching interview analytics:`, analyticsError);
      return NextResponse.json({ error: 'Failed to fetch interview analytics' }, { status: 500 });
    }

    if (!analyticsData || analyticsData.length === 0) {
      return NextResponse.json({ error: 'Interview analytics not found' }, { status: 404 });
    }

    const analytics = analyticsData;
    
    // Construct a new object with known serializable types to avoid issues with database-specific types
    const response = {
      type: analytics?.type || 'interview',
      job_id: analytics?.job_id || jobId,
      interview_funnel: {
        hired: Number(analytics?.interview_funnel?.hired) || 0,
        offered: Number(analytics?.interview_funnel?.offered) || 0,
        eligible: Number(analytics?.interview_funnel?.eligible) || 0,
        rejected: Number(analytics?.interview_funnel?.rejected) || 0,
        completed: Number(analytics?.interview_funnel?.completed) || 0,
        scheduled: Number(analytics?.interview_funnel?.scheduled) || 0,
      },
      panelist_summary: {
        total_panelists: Number(analytics?.panelist_summary?.total_panelists) || 0,
        total_evaluations: Number(analytics?.panelist_summary?.total_evaluations) || 0,
        avg_panelist_score: Number(analytics?.panelist_summary?.avg_panelist_score) || 0,
        max_panelist_score: Number(analytics?.panelist_summary?.max_panelist_score) || 0,
        total_score_available: Number(analytics?.panelist_summary?.total_score_available) || 0,
      },
      score_statistics: {
        avg_score: Number(analytics?.score_statistics?.avg_score) || 0,
        max_score: Number(analytics?.score_statistics?.max_score) || 0,
        total_score: Number(analytics?.score_statistics?.total_score) || 0,
        total_evaluations: Number(analytics?.score_statistics?.total_evaluations) || 0,
      },
      panelist_overview: Array.isArray(analytics?.panelist_overview) 
        ? analytics.panelist_overview.map((item: {
            type: string;
            title: string;
            out_of: number;
            average: number;
            description: string;
            evaluation_count: number;
          }) => ({
            type: item?.type || 'numeric',
            title: item?.title || '',
            out_of: Number(item?.out_of) || 10,
            average: Number(item?.average) || 0,
            description: item?.description || '',
            evaluation_count: Number(item?.evaluation_count) || 0,
          }))
        : [],
      panelist_performance: Array.isArray(analytics?.panelist_performance) ? analytics.panelist_performance.map((item: {
        panelist_id: string;
        panelist_name: string;
        average_score: number;
        total_evaluations: number;
        performance_metrics: Array<{
          category: string;
          score: number;
          max_score: number;
          evaluation_count: number;
        }>;
      }) => ({
        panelist_id: item?.panelist_id || '',
        panelist_name: item?.panelist_name || '',
        average_score: Number(item?.average_score) || 0,
        total_evaluations: Number(item?.total_evaluations) || 0,
        performance_metrics: Array.isArray(item?.performance_metrics) ? item.performance_metrics.map((metric: {
          category: string;
          score: number;
          max_score: number;
          evaluation_count: number;
        }) => ({
          category: metric?.category || '',
          score: Number(metric?.score) || 0,
          max_score: Number(metric?.max_score) || 0,
          evaluation_count: Number(metric?.evaluation_count) || 0,
        })) : [],
      })) : [],
      generated_at: analytics?.generated_at || new Date().toISOString(),
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}