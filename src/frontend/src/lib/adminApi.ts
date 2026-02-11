// Admin authentication API helpers
// Note: Since the backend is a Motoko canister on the Internet Computer,
// we cannot use traditional HTTP endpoints or cookies. This implementation
// uses hardcoded credentials for admin authentication.

const ADMIN_SESSION_KEY = 'admin_session';

// Hardcoded admin credentials
const HARDCODED_ADMIN = {
  username: 'OP Admin',
  password: 'Hellyea11',
};

interface AdminLoginRequest {
  username: string;
  password: string;
}

interface AdminLoginResponse {
  ok: boolean;
  message?: string;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Admin login - validates credentials against hardcoded values
 * Simulates POST /api/admin/login
 */
export async function adminLogin(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
  const { username, password } = credentials;

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Verify credentials using constant-time comparison
  const usernameMatches = constantTimeCompare(username, HARDCODED_ADMIN.username);
  const passwordMatches = constantTimeCompare(password, HARDCODED_ADMIN.password);

  if (usernameMatches && passwordMatches) {
    // Set session in sessionStorage (simulates httpOnly cookie)
    const session = {
      role: 'admin',
      timestamp: Date.now(),
    };
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    return { ok: true };
  }

  return { ok: false, message: 'Invalid admin credentials' };
}

/**
 * Admin logout - clears session
 * Simulates POST /api/admin/logout
 */
export async function adminLogout(): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Clear session
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

/**
 * Check admin session status
 * Simulates GET /api/admin/session or similar endpoint
 */
export async function checkAdminSession(): Promise<boolean> {
  try {
    const sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData);
    
    // Check if session is valid (role is admin)
    if (session.role !== 'admin') {
      return false;
    }

    // Optional: Check session age (24 hours)
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

// Export aliases for compatibility
export const login = adminLogin;
export const logout = adminLogout;
export const checkSession = checkAdminSession;
