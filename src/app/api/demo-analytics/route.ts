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
    
    // Fetch the demo analytics using the Supabase function
    const { data: analyticsData, error: analyticsError } = await supabase
      .rpc('get_demo_analytics', {
        p_job_id: jobId,
      });

    if (analyticsError) {
      console.error(`Error fetching demo analytics:`, analyticsError);
      return NextResponse.json({ error: 'Failed to fetch demo analytics' }, { status: 500 });
    }

    if (!analyticsData || analyticsData.length === 0) {
      return NextResponse.json({ error: 'Demo analytics not found' }, { status: 404 });
    }

    const analytics = analyticsData;
    
    // Construct a new object with known serializable types to avoid issues with database-specific types
    const response = {
      type: analytics?.type || 'demo',
      job_id: analytics?.job_id || jobId,
      demo_funnel: {
        failed: Number(analytics?.demo_funnel?.failed) || 0,
        passed: Number(analytics?.demo_funnel?.passed) || 0,
        started: Number(analytics?.demo_funnel?.started) || 0,
        submitted: Number(analytics?.demo_funnel?.submitted) || 0,
      },
      generated_at: analytics?.generated_at || new Date().toISOString(),
      overall_scores: {
        avg_score: Number(analytics?.overall_scores?.avg_score) || 0,
        max_score: Number(analytics?.overall_scores?.max_score) || 0,
        min_score: Number(analytics?.overall_scores?.min_score) || 0,
        evaluated_count: Number(analytics?.overall_scores?.evaluated_count) || 0,
      },
      category_scores: analytics?.category_scores ? Object.keys(analytics.category_scores).reduce((acc, category) => {
        const categoryData = analytics.category_scores[category];
        acc[category] = {
          avg_score: Number(categoryData?.avg_score) || 0,
          max_score: Number(categoryData?.max_score) || 0,
          min_score: Number(categoryData?.min_score) || 0,
          evaluated_count: Number(categoryData?.evaluated_count) || 0,
        };
        return acc;
      }, {} as Record<string, { avg_score: number; max_score: number; min_score: number; evaluated_count: number; }>) : {},
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}