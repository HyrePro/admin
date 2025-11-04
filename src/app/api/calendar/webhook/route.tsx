// ============================================
// FILE: /app/api/calendar/webhook/route.ts
// Fixed version with proper OAuth2Client instantiation
// ============================================

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

// Main webhook handler - This should be exported as POST
export async function POST(req: NextRequest) {
  try {
    const channelId = req.headers.get('x-goog-channel-id');
    const resourceState = req.headers.get('x-goog-resource-state');
    const resourceId = req.headers.get('x-goog-resource-id');

    console.log('Webhook received:', { channelId, resourceState, resourceId });

    // Respond to sync messages
    if (resourceState === 'sync') {
      return new NextResponse(null, { status: 200 });
    }

    // For actual event changes
    if (resourceState === 'exists' || resourceState === 'updated') {
      // Sync all events when changes occur
      await syncAllInterviewResponses();
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

// ============================================
// SYNC RESPONSES FROM GOOGLE TO SUPABASE
// ============================================
async function syncAllInterviewResponses() {
  try {
    // Create Supabase client
    const supabaseAdmin = createClient();
    
    // Get all scheduled interviews from Supabase
    const { data: schedules, error } = await supabaseAdmin
      .from('interview_schedules')
      .select('id, google_event_id')
      .eq('status', 'scheduled');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!schedules || schedules.length === 0) {
      console.log('No scheduled interviews found');
      return;
    }

    // Create OAuth2 client and set credentials
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    // Create calendar instance with the oauth2Client
    const calendar = google.calendar({ 
      version: 'v3', 
      auth: oauth2Client 
    });

    console.log(`Syncing ${schedules.length} interviews...`);

    // Sync each event
    for (const schedule of schedules) {
      try {
        // Get event details from Google Calendar
        const event = await calendar.events.get({
          calendarId: 'primary',
          eventId: schedule.google_event_id,
        });

        const attendees = event.data.attendees || [];
        
        console.log(`Event ${schedule.google_event_id}: ${attendees.length} attendees`);

        // Update each attendee's response in Supabase
        for (const attendee of attendees) {
          const updateData: any = {
            response_status: attendee.responseStatus || 'needsAction',
          };

          // Set responded_at if they've responded
          if (attendee.responseStatus !== 'needsAction') {
            updateData.responded_at = new Date().toISOString();
          }

          const { error: updateError } = await supabaseAdmin
            .from('interview_attendees')
            .update(updateData)
            .eq('interview_schedule_id', schedule.id)
            .eq('email', attendee.email);

          if (updateError) {
            console.error(`Error updating attendee ${attendee.email}:`, updateError);
          } else {
            console.log(`Updated ${attendee.email}: ${attendee.responseStatus}`);
          }
        }
      } catch (eventError: any) {
        console.error(`Error syncing event ${schedule.google_event_id}:`, eventError.message);
      }
    }

    console.log('Sync completed successfully');
  } catch (error: any) {
    console.error('Error syncing responses:', error.message);
    throw error;
  }
}
