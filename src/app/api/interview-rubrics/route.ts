import { NextRequest, NextResponse } from 'next/server'
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request)
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. Please log in.' }, { status: auth.status || 401 })
    }

    // Call the RPC function to get interview rubrics
    const { data, error } = await auth.supabaseService.rpc("get_interview_rubrics", {
      p_school_id: auth.schoolId
    })

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json(
        { error: `Failed to fetch interview rubrics: ${error.message || 'Unknown error'}`, details: error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        rubrics: data || [],
        message: 'Interview rubrics fetched successfully'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
