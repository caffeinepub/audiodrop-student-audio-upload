// Admin authentication API helpers
// This implementation calls the backend's adminLogin/adminLogout methods
// to establish session-based authentication on the Internet Computer canister.

const ADMIN_SESSION_KEY = 'admin_session';

interface AdminLoginRequest {
  username: string;
  password: string;
}

interface AdminLoginResponse {
  ok: boolean;
  message?: string;
}

/**
 * Get the backend actor instance
 * This is a workaround to access the actor outside of React components
 */
let actorInstance: any = null;

export function setActorInstance(actor: any) {
  actorInstance = actor;
}

/**
 * Admin login - sends credentials to backend for validation
 */
export async function adminLogin(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
  const { username, password } = credentials;

  try {
    // Call backend adminLogin to establish session on the canister
    if (!actorInstance) {
      throw new Error('Backend actor not available');
    }

    // Send credentials to backend with exact keys: username and password
    const response = await actorInstance.adminLogin({
      username: username,
      password: password,
    });
    
    // Backend returns AdminLoginResponse variant: { __kind__: "ok", ok: true } or { __kind__: "error", error: "message" }
    if (response.__kind__ === 'ok' && response.ok) {
      // Set session in sessionStorage for client-side tracking
      const session = {
        role: 'admin',
        timestamp: Date.now(),
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      return { ok: true };
    } else if (response.__kind__ === 'error') {
      // Return exact backend error message
      return { ok: false, message: response.error };
    } else {
      return { ok: false, message: 'Invalid admin credentials' };
    }
  } catch (error: any) {
    console.error('Admin login error:', error);
    // Return generic error message for network/system errors
    return { ok: false, message: 'Invalid admin credentials' };
  }
}

/**
 * Admin logout - clears session both client and backend
 */
export async function adminLogout(): Promise<void> {
  try {
    // Call backend adminLogout to clear session on the canister
    if (actorInstance) {
      await actorInstance.adminLogout();
    }
  } catch (error) {
    console.error('Admin logout error:', error);
  } finally {
    // Always clear client-side session
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

/**
 * Check admin session status
 * Checks both client-side session and backend session
 */
export async function checkAdminSession(): Promise<boolean> {
  try {
    // Verify backend session by calling getSessionRole
    if (actorInstance) {
      try {
        const role = await actorInstance.getSessionRole();
        if (role && role === 'admin') {
          // Sync client-side session storage
          const session = {
            role: 'admin',
            timestamp: Date.now(),
          };
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
          return true;
        } else {
          // Backend session doesn't match, clear client session
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
          return false;
        }
      } catch (error) {
        // If backend call fails, assume session is invalid
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        return false;
      }
    }

    // If actor not available, check client-side session as fallback
    const sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData);
    
    // Check if session is valid (role is admin)
    if (session.role !== 'admin') {
      return false;
    }

    // Check session age (24 hours)
    const sessionAge = Date.now() - session.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (sessionAge > maxAge) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clear all admin client state
 */
export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

/**
 * Verify admin session exists before making admin API calls
 * Throws an error with a clear message if not authenticated
 */
export async function verifyAdminSession(): Promise<void> {
  const isAdmin = await checkAdminSession();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin session required. Please log in.');
  }
}

// Export aliases for compatibility
export const login = adminLogin;
export const logout = adminLogout;
export const checkSession = checkAdminSession;
