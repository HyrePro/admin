import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/api/server';
import { getUserWithSchoolId } from '@/lib/supabase/api/server-auth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as string | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file || !bucket || !fileName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { user, schoolId, error } = await getUserWithSchoolId();
    
    if (!user) {
      return Response.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    if (!schoolId) {
      return Response.json({ error: 'No school associated with user' }, { status: 404 });
    }

    // Validate bucket name to prevent unauthorized access
    const allowedBuckets = ['profiles', 'school', 'avatars', 'documents'];
    if (!allowedBuckets.includes(bucket)) {
      return Response.json({ error: 'Invalid bucket name' }, { status: 400 });
    }

    // Upload file to Supabase storage
    const { data, error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(data.path);

    return Response.json({ 
      success: true, 
      publicUrl: publicUrl,
      path: data.path
    });
  } catch (error) {
    console.error('Server error in storage upload:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}