import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const interviewId = searchParams.get('id');
  const status = searchParams.get('status');

  if (!interviewId || !status) {
    return NextResponse.json(
      { error: 'Missing parameters' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Call SQL function to update status
  const { data, error } = await supabase
    .rpc('update_interview_confirmation_status', {
      p_interview_id: interviewId,
      p_status: status
    });

  if (error || !data?.success) {
    return NextResponse.json(
      { error: data?.error || 'Failed to update interview status' },
      { status: 500 }
    );
  }

  // Return confirmation HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: #f3f4f6;
        }
        .card {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
        }
        .success { color: #10B981; font-size: 48px; }
        h1 { color: #1F2937; margin: 20px 0; }
        p { color: #6B7280; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="success">✓</div>
        <h1>Thank You!</h1>
        <p>Interview status has been updated to: <strong>${status === 'completed' ? 'Completed' : 'Not Completed'}</strong></p>
        <p>You can close this window now.</p>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}