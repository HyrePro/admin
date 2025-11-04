import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET() {
  try {
    // Check if refresh token exists
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      return NextResponse.json({
        error: 'GOOGLE_REFRESH_TOKEN not found in environment variables',
        instructions: 'Please set up your refresh token first'
      }, { status: 400 });
    }

    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    // Try to access the calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.calendarList.list({
      maxResults: 1,
    });

    return NextResponse.json({
      success: true,
      message: '✅ Your Google Calendar integration is working!',
      calendars: response.data.items,
      note: 'You can now create Google Meet links'
    });
  } catch (error: unknown) {
    return NextResponse.json({
      error: 'Failed to connect to Google Calendar',
      message: (error as Error)?.message,
      instructions: [
        '1. Check if GOOGLE_REFRESH_TOKEN is set in .env.local',
        '2. Make sure the token is valid (not revoked)',
        '3. Verify Google Calendar API is enabled in Google Cloud Console'
      ]
    }, { status: 500 });
  }
}