import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogIn, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, identity, isLoggingIn, isLoginError, loginError } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileName, setProfileName] = useState('');

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (isAuthenticated && isFetched) {
      if (userProfile === null) {
        setShowProfileSetup(true);
      } else {
        navigate({ to: '/admin/dashboard' });
      }
    }
  }, [isAuthenticated, userProfile, isFetched, navigate]);

  const handleLogin = () => {
    login();
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveProfile.mutateAsync({
        name: profileName,
        email: undefined,
      });
      navigate({ to: '/admin/dashboard' });
    } catch (error) {
      console.error('Profile setup failed:', error);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Secure authentication required for admin access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoginError && loginError && (
            <Alert variant="destructive">
              <AlertDescription>{loginError.message}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Admin Login
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Admin access only. Unauthorized access is prohibited.</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showProfileSetup} onOpenChange={setShowProfileSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Profile Setup</DialogTitle>
            <DialogDescription>
              Please provide your admin name to continue
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Admin Name *</Label>
              <Input
                id="profileName"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="OP Admin"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!profileName.trim() || saveProfile.isPending}
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
