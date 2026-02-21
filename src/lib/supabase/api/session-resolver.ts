import type { AuthError, Session, SupabaseClient, User } from "@supabase/supabase-js";

type AuthCapableClient = Pick<SupabaseClient, "auth">;

export type ResolveSupabaseUserOptions = {
  allowSessionFallback?: boolean;
  refreshWindowSeconds?: number;
};

export type ResolvedSupabaseUser = {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
  source: "get_user" | "refresh_session" | "session_fallback" | "none";
};

function asAuthError(error: unknown): AuthError | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  if ("name" in error && "message" in error) {
    return error as AuthError;
  }

  return null;
}

/**
 * Resolve the current user in a way that tolerates transient token expiry:
 * 1) getUser (authoritative)
 * 2) refreshSession (uses refresh token)
 * 3) optional session fallback for UX continuity
 */
export async function resolveSupabaseUser(
  supabase: AuthCapableClient,
  options: ResolveSupabaseUserOptions = {}
): Promise<ResolvedSupabaseUser> {
  const allowSessionFallback = options.allowSessionFallback ?? false;
  const refreshWindowSeconds = options.refreshWindowSeconds ?? 5 * 60;

  let getUserError: AuthError | null = null;
  let user: User | null = null;

  try {
    const {
      data: { user: resolvedUser },
      error,
    } = await supabase.auth.getUser();
    user = resolvedUser;
    getUserError = error;
  } catch (error) {
    getUserError = asAuthError(error);
  }

  if (user) {
    return {
      user,
      session: null,
      error: null,
      source: "get_user",
    };
  }

  let session: Session | null = null;
  let sessionError: AuthError | null = null;

  try {
    const {
      data: { session: resolvedSession },
      error,
    } = await supabase.auth.getSession();
    session = resolvedSession;
    sessionError = error;
  } catch (error) {
    sessionError = asAuthError(error);
  }

  if (!session) {
    return {
      user: null,
      session: null,
      error: getUserError ?? sessionError,
      source: "none",
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at ?? 0;
  const shouldRefresh = !expiresAt || expiresAt <= nowSeconds + refreshWindowSeconds;

  if (shouldRefresh || getUserError) {
    let refreshError: AuthError | null = null;

    try {
      const { data, error } = await supabase.auth.refreshSession();
      refreshError = error;

      if (data.user) {
        return {
          user: data.user,
          session: data.session ?? session,
          error: null,
          source: "refresh_session",
        };
      }
    } catch (error) {
      refreshError = asAuthError(error);
    }

    if (allowSessionFallback && session.user) {
      return {
        user: session.user,
        session,
        error: refreshError ?? getUserError ?? sessionError,
        source: "session_fallback",
      };
    }

    return {
      user: null,
      session,
      error: refreshError ?? getUserError ?? sessionError,
      source: "none",
    };
  }

  if (allowSessionFallback && session.user) {
    return {
      user: session.user,
      session,
      error: getUserError ?? sessionError,
      source: "session_fallback",
    };
  }

  return {
    user: null,
    session,
    error: getUserError ?? sessionError,
    source: "none",
  };
}
