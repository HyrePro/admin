import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from request cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    // Parse request body
    const body = await request.json();
    const { token, action } = body;

    // Validate required fields
    if (!token || !action) {
      return NextResponse.json(
        { error: 'Token and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Get invitation from the invitations table
    const { data: invitation, error: invitationError } = await supabaseService
      .from('invitations')
      .select(`
        id,
        school_id,
        email,
        name,
        role,
        token,
        status,
        expires_at
      `)
      .eq('token', token)
      .single();

    if (invitationError || !invitation) {
      console.error('Error fetching invitation:', invitationError);
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
          message: 'This invitation link has expired.'
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

    // If action is reject, update the invitation status and return
    if (action === 'reject') {
      const { error: updateError } = await supabaseService
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('token', token);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update invitation status' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          message: 'Invitation rejected successfully',
          success: true 
        },
        { status: 200 }
      );
    }

    // If action is accept, we need to get the current user
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      return NextResponse.json(
        { 
          error: 'User not authenticated',
          message: 'You must be logged in to accept an invitation.',
          requiresAuth: true,
          invitationEmail: invitation.email
        },
        { status: 401 }
      );
    }

    // Check if the current user's email matches the invitation email
    if (currentUser.email !== invitation.email) {
      return NextResponse.json(
        { 
          error: 'Email mismatch',
          message: 'You cannot accept an invitation for a different email address.',
          requiresSignOut: true,
          currentEmail: currentUser.email,
          invitationEmail: invitation.email
        },
        { status: 403 }
      );
    }

    // Check if the user already has a school assigned
    const { data: existingUserInfo, error: userInfoError } = await supabaseService
      .from('admin_user_info')
      .select('school_id')
      .eq('id', currentUser.id)
      .single();

    let scenario = 'new_user_created'; // Default scenario

    if (existingUserInfo && existingUserInfo.school_id) {
      // User already has a school - this could be a school change scenario
      if (existingUserInfo.school_id === invitation.school_id) {
        scenario = 'already_member';
      } else {
        // This is a school change scenario
        return NextResponse.json(
          { 
            requiresConfirmation: true,
            currentSchool: {
              id: existingUserInfo.school_id,
              name: (await supabaseService
                .from('school_info')
                .select('name')
                .eq('id', existingUserInfo.school_id)
                .single()).data?.name || 'Current School'
            },
            newSchool: {
              id: invitation.school_id,
              name: (await supabaseService
                .from('school_info')
                .select('name')
                .eq('id', invitation.school_id)
                .single()).data?.name || 'New School'
            }
          },
          { status: 200 }
        );
      }
    } else {
      scenario = 'existing_user_no_school';
    }

    // Update user's school and role in admin_user_info
    const { error: userInfoUpdateError } = await supabaseService
      .from('admin_user_info')
      .upsert({
        id: currentUser.id,
        school_id: invitation.school_id,
        role: invitation.role,
        email: currentUser.email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (userInfoUpdateError) {
      console.error('Error updating user info:', userInfoUpdateError);
      return NextResponse.json(
        { error: 'Failed to update user information' },
        { status: 500 }
      );
    }

    // Update invitation status to accepted
    const { error: updateError } = await supabaseService
      .from('invitations')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('token', token);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invitation status' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        scenario: scenario,
        schoolId: invitation.school_id
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