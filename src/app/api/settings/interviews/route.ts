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

    // Fetch interview meeting settings for the school
    const { data, error: fetchError } = await supabase
      .from('interview_meeting_settings')
      .select('*')
      .eq('school_id', schoolId)
      .single();

    if (fetchError) {
      // If no settings exist yet, return default values
      if (fetchError.code === 'PGRST116') { // Row not found
        return Response.json({
          id: null,
          school_id: schoolId,
          default_interview_type: 'in-person',
          default_duration: '30',
          buffer_time: '0',
          working_hours_start: '09:00',
          working_hours_end: '17:00',
          candidate_reminder_hours: '24',
          interviewer_reminder_hours: '24',
          custom_instructions: '',
          working_days: [
            { day: 'monday', enabled: true, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'tuesday', enabled: true, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'wednesday', enabled: true, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'thursday', enabled: true, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'friday', enabled: true, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'saturday', enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'sunday', enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' }
          ],
          breaks: [],
          slots: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      console.error('Error fetching interview meeting settings:', fetchError);
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    // Ensure the returned data is serializable
    return Response.json(data ? JSON.parse(JSON.stringify(data)) : null);
  } catch (error) {
    console.error('Server error in interviews GET:', error);
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

    const settings = await request.json();

    // Check if settings exist for this school
    const { data: existingSettings } = await supabase
      .from('interview_meeting_settings')
      .select('id')
      .eq('school_id', schoolId)
      .single();

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('interview_meeting_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id);

      if (updateError) {
        console.error('Error updating interview meeting settings:', updateError);
        return Response.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from('interview_meeting_settings')
        .insert([{
          ...settings,
          school_id: schoolId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Error inserting interview meeting settings:', insertError);
        return Response.json({ error: insertError.message }, { status: 500 });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Server error in interviews PUT:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}