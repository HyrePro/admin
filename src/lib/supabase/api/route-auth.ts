import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { resolveSupabaseUser } from '@/lib/supabase/api/session-resolver';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type AuthResolution = {
  userId: string | null;
  schoolId: string | null;
  supabaseService: SupabaseClient | null;
  supabaseUser: SupabaseClient | null;
  error: string | null;
  status: number;
};

export type UserResolution = {
  userId: string | null;
  supabaseService: SupabaseClient | null;
  supabaseUser: SupabaseClient | null;
  error: string | null;
  status: number;
};

type SchoolCacheEntry = {
  schoolId: string;
  expiresAt: number;
};

const SCHOOL_ID_CACHE = new Map<string, SchoolCacheEntry>();
const SCHOOL_ID_TTL_MS = 5 * 60 * 1000;

function getCachedSchoolId(userId: string): string | null {
  const entry = SCHOOL_ID_CACHE.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    SCHOOL_ID_CACHE.delete(userId);
    return null;
  }
  return entry.schoolId;
}

function setCachedSchoolId(userId: string, schoolId: string) {
  SCHOOL_ID_CACHE.set(userId, {
    schoolId,
    expiresAt: Date.now() + SCHOOL_ID_TTL_MS,
  });
}

export async function resolveUserAndSchoolId(request: NextRequest): Promise<AuthResolution> {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return { userId: null, schoolId: null, supabaseService: null, supabaseUser: null, error: 'Server configuration error', status: 500 };
  }

  const supabaseService = createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const cookieStore = await cookies();
  const supabaseUser = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
    }
  );

  const cookieResolution = await resolveSupabaseUser(supabaseUser);
  let user = cookieResolution.user;
  let userError = cookieResolution.error;

  if (!user) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user: tokenUser }, error: tokenError } = await supabaseUser.auth.getUser(token);
        user = tokenUser;
        userError = tokenError;
      } catch (error) {
        // ignore
      }
    }
  }

  if (userError || !user) {
    return { userId: null, schoolId: null, supabaseService, supabaseUser, error: 'Unauthorized. Please log in.', status: 401 };
  }

  const cachedSchoolId = getCachedSchoolId(user.id);
  if (cachedSchoolId) {
    return { userId: user.id, schoolId: cachedSchoolId, supabaseService, supabaseUser, error: null, status: 200 };
  }

  const { data: adminInfo, error: adminError } = await supabaseService
    .from('admin_user_info')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (adminError || !adminInfo?.school_id) {
    return {
      userId: user.id,
      schoolId: null,
      supabaseService,
      supabaseUser,
      error: adminError?.message || 'User school information not found. Please complete your profile.',
      status: 404
    };
  }

  setCachedSchoolId(user.id, adminInfo.school_id);
  return { userId: user.id, schoolId: adminInfo.school_id, supabaseService, supabaseUser, error: null, status: 200 };
}

export async function resolveUser(request: NextRequest): Promise<UserResolution> {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return { userId: null, supabaseService: null, supabaseUser: null, error: 'Server configuration error', status: 500 };
  }

  const supabaseService = createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const cookieStore = await cookies();
  const supabaseUser = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
    }
  );

  const cookieResolution = await resolveSupabaseUser(supabaseUser);
  let user = cookieResolution.user;
  let userError = cookieResolution.error;

  if (!user) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user: tokenUser }, error: tokenError } = await supabaseUser.auth.getUser(token);
        user = tokenUser;
        userError = tokenError;
      } catch {
        // ignore
      }
    }
  }

  if (userError || !user) {
    return { userId: null, supabaseService, supabaseUser, error: 'Unauthorized. Please log in.', status: 401 };
  }

  return { userId: user.id, supabaseService, supabaseUser, error: null, status: 200 };
}
