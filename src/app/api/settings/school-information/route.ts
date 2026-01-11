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

    const { data, error: fetchError } = await supabase
      .from('school_info')
      .select('*')
      .eq('id', schoolId)
      .single();

    if (fetchError) {
      console.error('Error fetching school info:', fetchError);
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    // Ensure the returned data is serializable
    return Response.json(data ? JSON.parse(JSON.stringify(data)) : null);
  } catch (error) {
    console.error('Server error in school information GET:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, schoolId, error } = await getUserWithSchoolId();
    
    if (!user) {
      return Response.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    if (!schoolId) {
      return Response.json({ error: 'No school associated with user' }, { status: 404 });
    }

    const { name, location, board, address, school_type, num_students, num_teachers, website, logo_url } = await request.json();

    const { error: updateError } = await supabase
      .from('school_info')
      .update({
        name,
        location,
        board,
        address,
        school_type,
        num_students: num_students ? parseInt(num_students) : null,
        num_teachers: num_teachers ? parseInt(num_teachers) : null,
        website,
        logo_url
      })
      .eq('id', schoolId);

    if (updateError) {
      console.error('Error updating school info:', updateError);
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Server error in school information PUT:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}