import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAdminLogin } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldAlert, User, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const adminLogin = useAdminLogin();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!username.trim() || !password.trim()) {
      setAuthError('Please enter both username and password.');
      return;
    }

    try {
      await adminLogin.mutateAsync({ username, password });
      navigate({ to: '/admin/dashboard' });
    } catch (error: any) {
      // Display exact backend error message
      setAuthError(error?.message || 'Invalid admin credentials');
    }
  };

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
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Enter username"
                  className="pl-10"
                  required
                  autoFocus
                  disabled={adminLogin.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Enter password"
                  className="pl-10"
                  required
                  disabled={adminLogin.isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!username.trim() || !password.trim() || adminLogin.isPending}
            >
              {adminLogin.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Login
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Admin access only. Unauthorized access is prohibited.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
