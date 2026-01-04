/**
 * Authentication validation utilities
 */

/**
 * Validate the authentication state
 * @param user - The current user object
 * @param session - The current session object
 * @returns boolean indicating if the authentication state is valid
 */
export function isValidAuthState(user: any, session: any): boolean {
  // Check if user and session exist
  if (!user || !session) {
    return false;
  }

  // Check if session has required properties
  if (!session.access_token) {
    return false;
  }

  // Validate token expiration if available
  if (session.expires_at) {
    const now = new Date();
    const expiration = new Date(session.expires_at);
    if (now >= expiration) {
      return false; // Token has expired
    }
  }

  // Validate user properties
  if (!user.id) {
    return false;
  }

  return true;
}

/**
 * Check if the authentication token is about to expire
 * @param session - The current session object
 * @param thresholdMinutes - Number of minutes before expiration to consider "about to expire"
 * @returns boolean indicating if the token is about to expire
 */
export function isTokenExpiringSoon(session: any, thresholdMinutes: number = 5): boolean {
  if (!session || !session.expires_at) {
    return true; // If no expiration date, assume it's expiring
  }

  const now = new Date();
  const expiration = new Date(session.expires_at);
  const timeUntilExpiration = expiration.getTime() - now.getTime();
  const thresholdMs = thresholdMinutes * 60 * 1000;

  return timeUntilExpiration <= thresholdMs;
}

/**
 * Validate authentication headers
 * @param headers - The headers object to validate
 * @returns boolean indicating if the headers contain valid auth information
 */
export function isValidAuthHeaders(headers: HeadersInit): boolean {
  if (!headers) {
    return false;
  }

  // Check for authorization header
  const authHeader = (headers as Record<string, any>)['Authorization'] || (headers as Record<string, any>)['authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    return false;
  }

  // Check if it's a Bearer token
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  // Check if token is not empty
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (!token.trim()) {
    return false;
  }

  return true;
}

/**
 * Refresh authentication token if needed
 * @param session - The current session object
 * @returns Promise that resolves to updated session or null if refresh failed
 */
export async function refreshAuthTokenIfNeeded(session: any): Promise<any> {
  if (!session) {
    return null;
  }

  // Check if token is about to expire (within 5 minutes)
  if (!isTokenExpiringSoon(session, 5)) {
    // Token is still valid, return current session
    return session;
  }

  try {
    // Attempt to refresh the token
    // This would typically involve calling an API endpoint to refresh the token
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.refresh_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const newSession = await response.json();
    return newSession;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Validate session integrity
 * @param session - The session object to validate
 * @returns boolean indicating if the session is valid
 */
export function validateSessionIntegrity(session: any): boolean {
  if (!session) {
    return false;
  }

  // Check for required session properties
  if (!session.access_token || typeof session.access_token !== 'string') {
    return false;
  }

  // Additional validation checks can be added here
  // For example, checking if the token format is valid
  if (session.access_token.length < 10) { // Arbitrary minimum length check
    return false;
  }

  return true;
}