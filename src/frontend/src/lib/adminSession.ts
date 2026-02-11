// Admin session management for password-based authentication
// Note: This is a placeholder implementation as the backend doesn't currently support password-based auth
// In a production environment, this would integrate with backend session token management

export interface AdminSession {
  token: string;
  expiresAt: number;
  adminName: string;
}

const SESSION_STORAGE_KEY = 'audiodrop_admin_session';

export function getAdminSession(): AdminSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    
    const session: AdminSession = JSON.parse(stored);
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      clearAdminSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to retrieve admin session:', error);
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to store admin session:', error);
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear admin session:', error);
  }
}

export function isAdminSessionValid(): boolean {
  const session = getAdminSession();
  return session !== null && session.expiresAt > Date.now();
}
