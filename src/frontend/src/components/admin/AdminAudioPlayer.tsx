import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { ExternalBlob } from '../../backend';

interface AdminAudioPlayerProps {
  audio: ExternalBlob;
  title?: string;
}

export default function AdminAudioPlayer({ audio, title = 'Audio Playback' }: AdminAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use direct URL for streaming
        const url = audio.getDirectURL();
        
        if (mounted) {
          setAudioUrl(url);
        }
      } catch (err) {
        console.error('Failed to load audio:', err);
        if (mounted) {
          setError('Failed to load audio. Please try again.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      mounted = false;
    };
  }, [audio]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading audio...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {audioUrl && (
          <audio src={audioUrl} controls className="w-full" controlsList="nodownload" />
        )}
      </CardContent>
    </Card>
  );
}
