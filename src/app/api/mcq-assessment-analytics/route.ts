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
    
    // Fetch the MCQ assessment analytics using the Supabase function
    const { data: analyticsData, error: analyticsError } = await supabase
      .rpc('get_mcq_assessment_analytics', {
        p_job_id: jobId,
      });

    if (analyticsError) {
      console.error(`Error fetching MCQ assessment analytics:`, analyticsError);
      return NextResponse.json({ error: 'Failed to fetch MCQ assessment analytics' }, { status: 500 });
    }

    if (!analyticsData || analyticsData.length === 0) {
      return NextResponse.json({ error: 'MCQ assessment analytics not found' }, { status: 404 });
    }

    const analytics = analyticsData;
    
    // Construct a new object with known serializable types to avoid issues with database-specific types
    const response = {
      type: analytics?.type || 'mcq_assessment',
      job_id: analytics?.job_id || jobId,
      metrics: {
        avg_score: Number(analytics?.metrics?.avg_score) || 0,
        avg_attempted: Number(analytics?.metrics?.avg_attempted) || 0,
        avg_percentage: Number(analytics?.metrics?.avg_percentage) || 0,
        avg_total_questions: Number(analytics?.metrics?.avg_total_questions) || 0,
      },
      summary: {
        failed: Number(analytics?.summary?.failed) || 0,
        passed: Number(analytics?.summary?.passed) || 0,
        eligible: Number(analytics?.summary?.eligible) || 0,
        attempted: Number(analytics?.summary?.attempted) || 0,
      },
      generated_at: analytics?.generated_at || new Date().toISOString(),
      category_metrics: analytics?.category_metrics ? Object.keys(analytics.category_metrics).reduce((acc, category) => {
        const categoryData = analytics.category_metrics[category];
        acc[category] = {
          avg_score: Number(categoryData?.avg_score) || 0,
          avg_attempted: Number(categoryData?.avg_attempted) || 0,
          avg_percentage: Number(categoryData?.avg_percentage) || 0,
          avg_total_questions: Number(categoryData?.avg_total_questions) || 0,
        };
        return acc;
      }, {} as Record<string, { avg_score: number; avg_attempted: number; avg_percentage: number; avg_total_questions: number; }>) : {},
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}