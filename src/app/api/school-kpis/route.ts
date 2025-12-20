import { createClient } from '@/lib/supabase/api/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get('schoolId');
  const period = searchParams.get('period') || 'all';

  if (!schoolId) {
    return NextResponse.json({ error: 'Missing schoolId parameter' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    
    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc('get_school_kpis', {
      school_id: schoolId,
      period: period
    });

    if (error) {
      console.error('Error fetching KPIs:', error);
      return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}