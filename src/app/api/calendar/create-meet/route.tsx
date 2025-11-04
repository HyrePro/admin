import { createClient } from '@/lib/supabase/api/client';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      candidateId,
      candidateName,
      candidateEmail,
      position,
      summary,
      description,
      startDateTime,
      endDateTime,
      panelists, // Array of { email, name, role }
    } = body;

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Prepare attendees list
    const allAttendees = [
      { email: candidateEmail, responseStatus: 'needsAction' },
      ...panelists.map((p: any) => ({ 
        email: p.email, 
        responseStatus: 'needsAction' 
      })),
    ];

    // Create calendar event with Google Meet
    const event = {
      summary: summary || `Interview with ${candidateName}`,
      description: description || `Interview for ${position} position`,
      start: {
        dateTime: startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: allAttendees,
      conferenceData: {
        createRequest: {
          requestId: `hyrepro-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
    };

    // Create Google Calendar event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: event,
    });

    const eventId = response.data.id!;
    const meetLink = response.data.hangoutLink!;
    const calendarLink = response.data.htmlLink!;
    const supabaseAdmin = createClient();
    // Save to Supabase
    const { data: scheduleData, error: scheduleError } = await supabaseAdmin
      .from('interview_schedules')
      .insert({
        candidate_id: candidateId,
        candidate_email: candidateEmail,
        candidate_name: candidateName,
        position: position,
        google_event_id: eventId,
        google_meet_link: meetLink,
        google_calendar_link: calendarLink,
        start_time: startDateTime,
        end_time: endDateTime,
        status: 'scheduled',
      })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    // Save attendees to Supabase
    const attendeesToInsert = [
      {
        interview_schedule_id: scheduleData.id,
        email: candidateEmail,
        name: candidateName,
        role: 'candidate',
        response_status: 'needsAction',
      },
      ...panelists.map((p: any) => ({
        interview_schedule_id: scheduleData.id,
        email: p.email,
        name: p.name,
        role: p.role || 'panelist',
        response_status: 'needsAction',
      })),
    ];

    const { error: attendeesError } = await supabaseAdmin
      .from('interview_attendees')
      .insert(attendeesToInsert);

    if (attendeesError) throw attendeesError;

    // Set up webhook watch for this event
    await setupGoogleWebhook(eventId);

    return NextResponse.json({
      success: true,
      scheduleId: scheduleData.id,
      eventId: eventId,
      meetLink: meetLink,
      calendarLink: calendarLink,
    });
  } catch (error: any) {
    console.error('Error creating Google Meet:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}