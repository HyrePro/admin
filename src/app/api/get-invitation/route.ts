import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or anon key is not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Service client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const body = await request.json();
    const { token } = body;

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get invitation from the invitations table
    const { data: invitation, error } = await supabaseService
      .from('invitations')
      .select(`
        id,
        school_id,
        email,
        name,
        role,
        token,
        status,
        expires_at,
        created_at,
        updated_at,
        schools (name, location, logo_url)
      `)
      .eq('token', token)
      .single();

    if (error) {
      console.error('Error fetching invitation:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitation' },
        { status: 500 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      // Update the invitation status to expired
      await supabaseService
        .from('invitations')
        .update({ status: 'expired' })
        .eq('token', token);

      return NextResponse.json(
        { 
          error: 'Invitation has expired',
          message: 'This invitation link has expired. Please request a new one.'
        },
        { status: 400 }
      );
    }

    // Check if invitation has already been accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { 
          error: 'Invitation already accepted',
          message: 'This invitation has already been accepted.'
        },
        { status: 400 }
      );
    }

    // Return invitation data
    return NextResponse.json(
      { 
        invitation: {
          id: invitation.id,
          school_info: {
            name: invitation.schools[0]?.name,
            location: invitation.schools[0]?.location,
            logo_url: invitation.schools[0]?.logo_url,
          },
          role: invitation.role,
          email: invitation.email,
          name: invitation.name,
          expires_at: invitation.expires_at,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}