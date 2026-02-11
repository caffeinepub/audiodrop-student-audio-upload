import { ReactNode } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Music, LogOut, LayoutDashboard, Settings, FileText } from 'lucide-react';
import { SiCaffeine } from 'react-icons/si';
import { clearAdminSession } from '../lib/adminSession';
import { clearCsrfToken } from '../lib/csrf';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, clear } = useInternetIdentity();
  const routerState = useRouterState();
  const isAuthenticated = !!identity;
  const isAdminRoute = routerState.location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    await clear();
    clearAdminSession();
    clearCsrfToken();
    queryClient.clear();
    navigate({ to: '/' });
  };

  const appIdentifier = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.hostname)
    : 'audiodrop-app';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src="/assets/generated/audiodrop-logo.dim_512x512.png" 
                alt="AudioDrop Logo" 
                className="h-10 w-10"
              />
              <div className="flex flex-col items-start">
                <h1 className="text-xl font-bold text-foreground">AudioDrop</h1>
                <p className="text-xs text-muted-foreground">Student Audio Upload</p>
              </div>
            </button>

            <nav className="flex items-center gap-2">
              {isAdminRoute && isAuthenticated && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: '/admin/dashboard' })}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: '/admin/audit-log' })}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Audit Log
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: '/admin/settings' })}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
              {!isAdminRoute && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/admin/login' })}
                >
                  Admin Login
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span>© {new Date().getFullYear()} AudioDrop</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Built with</span>
              <SiCaffeine className="h-4 w-4 text-amber-600" />
              <span>using</span>
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
