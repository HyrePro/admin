import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll: async () => (await cookieStore).getAll(),
          setAll: (cookiesToSet) =>
            cookiesToSet.forEach(async c =>
              (await cookieStore).set(c.name, c.value, c.options)
            ),
        },
      }
    );

    const body = await req.json();
    const { token, action, confirmed } = body;

    if (!token || !action) {
      return NextResponse.json(
        { error: 'Token and action are required' },
        { status: 400 }
      );
    }

    // Get authenticated user (may be null)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // === CALL SQL: process_invitation ===
    const { data, error } = await supabase.rpc(
      confirmed ? 'confirm_school_switch' : 'process_invitation',
      confirmed
        ? {
            p_token: token,
            p_user_id: user?.id ?? null,
          }
        : {
            p_token: token,
            p_action: action,
            p_user_id: user?.id ?? null,
          }
    );

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // RPC returns TABLE → first row
    const rawResult = Array.isArray(data) ? data[0] : data;
    const result = rawResult && typeof rawResult === 'object'
      ? {
          ...rawResult,
          error:
            (rawResult as { error?: string; error_message?: string; message?: string }).error ??
            (rawResult as { error_message?: string }).error_message ??
            (rawResult as { message?: string }).message,
          message:
            (rawResult as { message?: string; error_message?: string }).message ??
            (rawResult as { error_message?: string }).error_message,
          requiresConfirmation:
            (rawResult as { requiresConfirmation?: boolean; requires_confirmation?: boolean }).requiresConfirmation ??
            (rawResult as { requires_confirmation?: boolean }).requires_confirmation ??
            false,
        }
      : rawResult;

    // Confirmation-required is a handled flow, not a hard API failure.
    if (result?.requiresConfirmation && !confirmed) {
      return NextResponse.json(result, { status: 200 });
    }

    // Explicit failure surfaced from SQL
    if (result?.success === false) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err) {
    console.error('Unhandled API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
