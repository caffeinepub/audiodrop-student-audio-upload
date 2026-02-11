import { ReactNode, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsAdmin } from '../hooks/useQueries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

interface AdminRouteGuardProps {
  children: ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsAdmin();

  const isAuthenticated = !!identity;
  const isLoading = isInitializing || isCheckingAdmin;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/admin/login' });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Alert variant="destructive">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
          <AlertDescription className="mt-2">
            You do not have permission to access this area. Admin privileges are required.
          </AlertDescription>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/' })}
            >
              Return to Home
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
