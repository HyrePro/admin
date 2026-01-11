// /api/settings/users/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/api/server';
import { getUserWithSchoolId } from '@/lib/supabase/api/server-auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, schoolId, error: authError } = await getUserWithSchoolId();
    if (!user) return Response.json({ error: authError || 'Unauthorized' }, { status: 401 });
    if (!schoolId) return Response.json({ error: 'No school associated with user' }, { status: 404 });

    const body = await request.json();
    const {
      page = 0,
      sort = 'joined_at',
      asc = true,
      search = null,
      page_size = 20,
    } = body;

    const start_index = page * page_size;
    const end_index = start_index + page_size - 1;

    // Fetch paginated users via SQL function
    const { data: usersData, error: usersError } = await supabase.rpc('get_admin_users', {
      p_asc: asc,
      p_end_index: end_index,
      p_school_id: schoolId,
      p_search: search,
      p_sort: sort,
      p_start_index: start_index,
    });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return Response.json({ error: usersError.message }, { status: 500 });
    }

    // Fetch total count via SQL function
    const { data: totalData, error: totalError } = await supabase.rpc('get_admin_users_count', {
      p_school_id: schoolId,
      p_search: search,
    });

    if (totalError) {
      console.error('Error fetching users count:', totalError);
      return Response.json({ error: totalError.message }, { status: 500 });
    }

    // Add default status 'active' to all users
    const usersWithStatus = (usersData || []).map((u: any) => ({
      ...u,
      status: 'active' as const,
      role: String(u.role || 'admin') as 'admin' | 'hr' | 'interviewer' | 'viewer',
    }));

    return Response.json({
      users: usersWithStatus,
      total: totalData || 0,
    });
  } catch (err) {
    console.error('Server error in users POST:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
