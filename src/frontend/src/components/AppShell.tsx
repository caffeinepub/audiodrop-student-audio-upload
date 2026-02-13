import { Link, useLocation } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useIsAdmin, useBackendHealth } from '../hooks/useQueries';
import { Music, Settings, FileText } from 'lucide-react';
import RuntimeIcConfigDebug from './RuntimeIcConfigDebug';
import CanisterIdBanner from './CanisterIdBanner';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: isAdmin } = useIsAdmin();
  
  // Trigger health check on app load
  useBackendHealth();

  // Hide header and footer on success page, but always show canister banner
  const isSuccessPage = location.pathname === '/success';

  if (isSuccessPage) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <CanisterIdBanner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-8">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Music className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AudioDrop</span>
            </Link>

            <nav className="flex items-center gap-4">
              {isAdmin ? (
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
                </>
              ) : null}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6 space-y-4">
          {/* Debug display - temporary for verification */}
          <RuntimeIcConfigDebug />
          
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

      <CanisterIdBanner />
    </div>
  );
}
