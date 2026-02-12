import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useIsAdmin } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useIsAdmin();

  useEffect(() => {
    if (isAdmin) {
      navigate({ to: '/admin/dashboard' });
    }
  }, [isAdmin, navigate]);

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/generated/audiodrop-logo.dim_512x512.png" 
              alt="AudioDrop Logo" 
              className="h-20 w-20"
            />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Checking admin permissions...
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying credentials...</p>
            </div>
          ) : !isAdmin ? (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                Access denied. You do not have admin permissions.
                <br />
                <br />
                Admin access is controlled by the Internet Computer identity system.
                Please authenticate with an authorized admin identity.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Admin access only. Unauthorized access is prohibited.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
