import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/api/server';
import { getUserWithSchoolId } from '@/lib/supabase/api/server-auth';

const ACCOUNT_ROUTE_TIMEOUT_MS = 25_000;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = ACCOUNT_ROUTE_TIMEOUT_MS): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Account request timed out'));
    }, timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, error } = await withTimeout(getUserWithSchoolId());
    
    if (!user) {
      return Response.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const { data, error: fetchError } = await withTimeout(
      supabase
        .from('admin_user_info')
        .select('*')
        .eq('id', user.id)
        .single()
    );

    if (fetchError) {
      console.error('Error fetching user info:', fetchError);
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    // Ensure the returned data is serializable
    return Response.json(data ? JSON.parse(JSON.stringify(data)) : null);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      return Response.json({ error: 'Account request timed out. Please try again.' }, { status: 504 });
    }
    console.error('Server error in account GET:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, error } = await withTimeout(getUserWithSchoolId());
    
    if (!user) {
      return Response.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const { first_name, last_name, phone_no } = await request.json();

    const { error: updateError } = await withTimeout(
      supabase
        .from('admin_user_info')
        .update({
          first_name,
          last_name,
          phone_no
        })
        .eq('id', user.id)
    );

    if (updateError) {
      console.error('Error updating user info:', updateError);
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      return Response.json({ error: 'Account request timed out. Please try again.' }, { status: 504 });
    }
    console.error('Server error in account PUT:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
