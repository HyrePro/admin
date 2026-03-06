import { createClient as createServiceClient } from '@supabase/supabase-js'

type AdminUserSeed = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}

let cachedServiceClient: ReturnType<typeof createServiceClient> | null = null

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not configured')
    return null
  }

  if (!cachedServiceClient) {
    cachedServiceClient = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  return cachedServiceClient
}

export async function ensureAdminUserInfo(user: AdminUserSeed) {
  const service = getServiceClient()
  if (!service || !user?.id) return null

  try {
    const { data: existing, error: existingError } = await service
      .from('admin_user_info')
      .select('id, school_id')
      .eq('id', user.id)
      .maybeSingle()

    if (existing) {
      return existing
    }

    if (existingError) {
      console.error('Error checking admin_user_info:', existingError)
    }

    const metadata = user.user_metadata ?? {}
    const firstName =
      (metadata['first_name'] as string | undefined) ||
      (metadata['firstName'] as string | undefined) ||
      (user.email ? user.email.split('@')[0] : 'Unknown')
    const lastName =
      (metadata['last_name'] as string | undefined) ||
      (metadata['lastName'] as string | undefined) ||
      'User'
    const phoneNo =
      (metadata['contact_number'] as string | undefined) ||
      (metadata['phone_no'] as string | undefined) ||
      (metadata['phone'] as string | undefined) ||
      ''

    const insertPayload = {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      email: user.email ?? '',
      phone_no: phoneNo,
      school_id: null,
    }

    const { error: insertError } = await service
      .from('admin_user_info')
      .upsert([insertPayload], { onConflict: 'id', ignoreDuplicates: true })

    if (insertError) {
      console.error('Failed to upsert admin_user_info:', insertError)
    }

    return { id: user.id, school_id: null }
  } catch (error) {
    console.error('Unexpected error ensuring admin_user_info:', error)
    return null
  }
}
