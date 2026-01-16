import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/api/client';

interface AvailabilityRequestBody {
  panelistEmail: string;
  interviewDate: string; // YYYY-MM-DD format
  startTime: string;     // HH:MM format
  endTime: string;       // HH:MM format
}

export async function POST(request: NextRequest) {
  try {
    const body: AvailabilityRequestBody = await request.json();
    const { panelistEmail, interviewDate, startTime, endTime } = body;

    // Validate inputs
    if (!panelistEmail || !interviewDate || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: panelistEmail, interviewDate, startTime, endTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient();

    // Calculate end time based on start time and duration
    const result = await supabase.rpc('check_panelist_availability', {
      p_panelist_email: panelistEmail,
      p_interview_date: interviewDate,
      p_start_time: startTime,
      p_end_time: endTime
    });

    if (result.error) {
      console.error('Error checking panelist availability:', result.error);
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in check panelist availability API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}