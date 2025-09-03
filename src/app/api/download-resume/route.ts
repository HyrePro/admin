import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'resume.pdf';

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    // Validate that it's a proper URL
    let url: URL;
    try {
      url = new URL(fileUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch the file from the source
    const response = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResumeDownloader/1.0)',
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.status}` }, 
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Create response with aggressive download headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream', // Force download instead of application/pdf
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"; filename*=UTF-8''${encodeURIComponent(sanitizedFilename)}`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'Content-Transfer-Encoding': 'binary',
        // Additional headers to prevent inline viewing
        'X-Download-Options': 'noopen',
        'X-Frame-Options': 'DENY'
      },
    });
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error during file download' }, 
      { status: 500 }
    );
  }
}