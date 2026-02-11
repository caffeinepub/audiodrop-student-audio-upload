import { Link, useLocation } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useAdminSession } from '../hooks/useQueries';
import { Music, Settings, FileText, LogOut } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: session, logout } = useAdminSession();
  const isAuthenticated = !!session;

  // Hide header and footer on success page
  const isSuccessPage = location.pathname === '/success';

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isSuccessPage) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Music className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AudioDrop</span>
            </Link>

            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/admin/dashboard">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/admin/audit">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Audit
                    </Button>
                  </Link>
                  <Link to="/admin/settings">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logout.isPending}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/admin/login">
                  <Button variant="outline" size="sm">
                    Admin Login
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} AudioDrop. All rights reserved.</p>
            <p>
              Built with ❤️ using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.hostname : 'audiodrop'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
