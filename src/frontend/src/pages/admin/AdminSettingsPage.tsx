import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetAdminSettings, useUpdateAdminSettings } from '../../hooks/useQueries';
import { Loader2, Save, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const [captchaEnabled, setCaptchaEnabled] = useState(settings?.captchaEnabled ?? false);
  const [maxAudioSize, setMaxAudioSize] = useState(settings?.maxAudioSizeMB?.toString() ?? '25');
  const [maxVideoSize, setMaxVideoSize] = useState(settings?.maxVideoSizeMB?.toString() ?? '25');

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        captchaEnabled,
        maxAudioSizeMB: parseInt(maxAudioSize) || 25,
        maxVideoSizeMB: parseInt(maxVideoSize) || 25,
      });
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings. Backend implementation required.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and upload limits
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Note: Settings functionality requires backend implementation. Changes are currently stored client-side only.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Configure anti-spam and security features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="captcha">CAPTCHA Verification</Label>
              <p className="text-sm text-muted-foreground">
                Require users to complete a verification challenge before submitting
              </p>
            </div>
            <Switch
              id="captcha"
              checked={captchaEnabled}
              onCheckedChange={setCaptchaEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Rate Limiting</Label>
            <p className="text-sm text-muted-foreground">
              Maximum submissions per hour: <strong>{settings?.maxSubmissionsPerHour ?? 10}</strong>
            </p>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Rate limiting is enforced by the backend and cannot be modified from the UI.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Limits</CardTitle>
          <CardDescription>
            Configure maximum file sizes for uploads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxAudioSize">Maximum Audio File Size (MB)</Label>
            <Input
              id="maxAudioSize"
              type="number"
              min="1"
              max="100"
              value={maxAudioSize}
              onChange={(e) => setMaxAudioSize(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Current limit: {maxAudioSize}MB
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxVideoSize">Maximum Video File Size (MB)</Label>
            <Input
              id="maxVideoSize"
              type="number"
              min="1"
              max="100"
              value={maxVideoSize}
              onChange={(e) => setMaxVideoSize(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Current limit: {maxVideoSize}MB
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          size="lg"
        >
          {updateSettings.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
