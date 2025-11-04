import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Check if user denied access
    if (error) {
      return NextResponse.json(
        { 
          error: 'Access denied',
          message: 'You need to grant calendar permissions to use this feature'
        },
        { status: 400 }
      );
    }

    // Check if code exists
    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Display the tokens
    return NextResponse.json({
      success: true,
      message: '✅ SUCCESS! Copy the refresh_token below to your .env.local file',
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      instructions: [
        '1. Copy the refresh_token value above',
        '2. Open your .env.local file',
        '3. Add this line: GOOGLE_REFRESH_TOKEN=paste_your_token_here',
        '4. Restart your Next.js dev server',
        '5. You can now create Google Meet links!'
      ],
      note: 'This refresh token never expires unless revoked, so save it securely'
    });
  } catch (error: any) {
    console.error('Error getting tokens:', error);
    return NextResponse.json(
      { 
        error: error.message,
        details: 'Make sure your Google OAuth credentials are correct in .env.local'
      },
      { status: 500 }
    );
  }
}