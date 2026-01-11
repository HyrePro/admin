import { createClient } from '@/lib/supabase/api/server';

/**
 * Server-side utility to get user info with school_id
 * This function can be reused across API routes to avoid duplicate code
 * @param request - The NextRequest object to extract auth headers if needed
 * @returns Object containing user and school_id or null if not authenticated
 */
export async function getUserWithSchoolId() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { user: null, schoolId: null, error: 'Unauthorized. Please log in.' };
    }
    
    // Get user's admin info to retrieve school_id
    const { data: adminInfo, error: adminError } = await supabase
      .from('admin_user_info')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (adminError || !adminInfo?.school_id) {
      return { 
        user, 
        schoolId: null, 
        error: adminError?.message || 'User school information not found. Please complete your profile.' 
      };
    }

    return { user, schoolId: adminInfo.school_id, error: null };
  } catch (error) {
    console.error('Error in getUserWithSchoolId:', error);
    return { user: null, schoolId: null, error: 'Internal server error' };
  }
}

/**
 * Server-side utility to validate user authentication and get school_id
 * @returns Object with authentication status and school_id
 */
export async function validateUserAuthAndSchool() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { authenticated: false, schoolId: null, user: null, error: 'Unauthorized. Please log in.' };
    }
    
    // Get user's admin info to retrieve school_id
    const { data: adminInfo, error: adminError } = await supabase
      .from('admin_user_info')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (adminError || !adminInfo?.school_id) {
      return { 
        authenticated: true,
        user,
        schoolId: null, 
        error: adminError?.message || 'User school information not found. Please complete your profile.' 
      };
    }

    return { 
      authenticated: true, 
      user,
      schoolId: adminInfo.school_id, 
      error: null 
    };
  } catch (error) {
    console.error('Error in validateUserAuthAndSchool:', error);
    return { 
      authenticated: false, 
      user: null,
      schoolId: null, 
      error: 'Internal server error' 
    };
  }
}