import { createClient } from "@/lib/supabase/api/client";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";


// Create OAuth2 client helper function
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export async function GET_SYNC(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get('scheduleId');

    if (scheduleId) {
      // Sync specific interview
      await syncSpecificInterview(scheduleId);
    } else {
      // Sync all interviews
      await syncAllInterviewResponses();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error syncing:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function syncSpecificInterview(scheduleId: string) {
    const supabaseAdmin = createClient();   
  const { data: schedule, error } = await supabaseAdmin
    .from('interview_schedules')
    .select('id, google_event_id')
    .eq('id', scheduleId)
    .single();

  if (error) throw error;

  const calendar = google.calendar({ version: 'v3', auth: getOAuth2Client() });

  const event = await calendar.events.get({
    calendarId: 'primary',
    eventId: schedule.google_event_id,
  });

  const attendees = event.data.attendees || [];

  for (const attendee of attendees) {
    const updateData: any = {
      response_status: attendee.responseStatus || 'needsAction',
    };

    if (attendee.responseStatus !== 'needsAction') {
      updateData.responded_at = new Date().toISOString();
    }
    const supabaseAdmin = createClient();
    await supabaseAdmin
      .from('interview_attendees')
      .update(updateData)
      .eq('interview_schedule_id', schedule.id)
      .eq('email', attendee.email);
  }
}
