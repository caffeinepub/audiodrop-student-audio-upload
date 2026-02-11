import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { ExternalBlob } from '../../backend';

interface AdminVideoPlayerProps {
  video: ExternalBlob;
  title?: string;
}

export default function AdminVideoPlayer({ video, title = 'Video Playback' }: AdminVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use direct URL for streaming
        const url = video.getDirectURL();
        
        if (mounted) {
          setVideoUrl(url);
        }
      } catch (err) {
        console.error('Failed to load video:', err);
        if (mounted) {
          setError('Failed to load video. Please try again.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadVideo();

    return () => {
      mounted = false;
    };
  }, [video]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading video...</span>
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
        {videoUrl && (
          <video 
            src={videoUrl} 
            controls 
            className="w-full rounded-lg" 
            controlsList="nodownload"
          />
        )}
      </CardContent>
    </Card>
  );
}
