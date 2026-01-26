import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters from query string
    const p_school_id = searchParams.get('p_school_id');

    // Validate required parameters
    if (!p_school_id) {
      return NextResponse.json(
        { error: 'p_school_id is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Call the RPC function
    const { data, error } = await supabase.rpc('get_interview_dashboard_stats', {
      p_school_id
    });

    if (error) {
      console.error('Error calling get_interview_dashboard_stats RPC:', error);
      return NextResponse.json(
        { error: `Failed to fetch interview stats: ${error.message}` },
        { status: 500 }
      );
    }

    // Serialize the data to ensure proper JSON representation
    // Use JSON.parse(JSON.stringify()) to handle any PostgreSQL composite types or nested objects
    const serializedData = data && data.length > 0 ? 
      JSON.parse(JSON.stringify(data[0])) : {};
    
    // Return the fully serialized data
    return NextResponse.json(serializedData);

  } catch (error) {
    console.error('Unexpected error in interview stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}