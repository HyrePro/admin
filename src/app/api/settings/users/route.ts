import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/api/server';
import { getUserWithSchoolId } from '@/lib/supabase/api/server-auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, schoolId, error } = await getUserWithSchoolId();
    
    if (!user) {
      return Response.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    if (!schoolId) {
      return Response.json({ error: 'No school associated with user' }, { status: 404 });
    }

    // Fetch admin users with avatar information
    const { data: userData, error: userError } = await supabase
      .from('admin_user_info')
      .select('id, first_name, last_name, email, role, avatar')
      .eq('school_id', schoolId);

    if (userError) {
      console.error('Error fetching admin users:', userError);
      return Response.json({ error: userError.message }, { status: 500 });
    }

    // Transform user data to include status
    const usersWithStatus = (userData || []).map(user => ({
      ...user,
      status: 'active' as const,
      role: (user.role || 'admin') as 'admin' | 'hr' | 'viewer'
    }));

    // Fetch panelists
    const { data: panelistData, error: panelistError } = await supabase
      .from('interview_panelists')
      .select('id, name, email')
      .eq('school_id', schoolId);

    if (panelistError) {
      console.error('Error fetching panelists:', panelistError);
      return Response.json({ error: panelistError.message }, { status: 500 });
    }

    // Transform panelist data to match UserInfo structure
    const panelistsAsUsers = (panelistData || []).map(panelist => ({
      id: panelist.id,
      first_name: panelist.name.split(' ')[0] || '',
      last_name: panelist.name.split(' ').slice(1).join(' ') || '',
      email: panelist.email,
      role: 'interviewer' as const,
      status: 'active' as const
    }));

    // Combine users and panelists
    const allUsers = [...usersWithStatus, ...panelistsAsUsers];

    return Response.json(allUsers);
  } catch (error) {
    console.error('Server error in users GET:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}