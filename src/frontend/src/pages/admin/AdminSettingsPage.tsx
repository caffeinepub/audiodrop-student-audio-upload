import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Info, Loader2 } from 'lucide-react';
import { useGetAdminSettings, useUpdateAdminSettings } from '../../hooks/useQueries';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [captchaEnabled, setCaptchaEnabled] = useState(settings?.captchaEnabled ?? false);

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({ captchaEnabled });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings. Backend support required.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings and preferences
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Backend Support Required</AlertTitle>
        <AlertDescription>
          Settings functionality requires backend endpoints for CAPTCHA toggle, email configuration, and other admin preferences. These features will be available once the backend implements the necessary APIs.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Anti-Spam Settings</CardTitle>
          <CardDescription>Configure CAPTCHA and rate limiting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="captcha-toggle">Require CAPTCHA Verification</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, students must complete a verification challenge before submitting
              </p>
            </div>
            <Switch
              id="captcha-toggle"
              checked={captchaEnabled}
              onCheckedChange={setCaptchaEnabled}
              disabled={updateSettings.isPending}
            />
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate Limit:</span>
                <span className="font-medium">10 submissions per hour per IP</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate limiting is enforced by the backend to prevent abuse
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Limits</CardTitle>
          <CardDescription>Current file size and duration limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maximum File Size:</span>
              <span className="font-medium">25 MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maximum Recording Duration:</span>
              <span className="font-medium">10 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
