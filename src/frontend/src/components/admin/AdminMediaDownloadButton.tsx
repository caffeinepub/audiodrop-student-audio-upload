import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ExternalBlob, MediaType } from '../../backend';
import { normalizeMimeType, getExtensionFromMimeType } from '../../lib/mediaMime';

interface AdminMediaDownloadButtonProps {
  mediaBlob: ExternalBlob;
  mediaType: MediaType;
  fileName?: string;
  mimeType?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function AdminMediaDownloadButton({
  mediaBlob,
  mediaType,
  fileName,
  mimeType,
  variant = 'outline',
  size = 'sm',
}: AdminMediaDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const bytes = await mediaBlob.getBytes();
      
      // Determine MIME type based on provided info or media type
      let finalMimeType: string;
      
      if (mimeType) {
        // Use provided MIME type
        finalMimeType = normalizeMimeType(mimeType);
      } else if (fileName) {
        // Infer from filename extension
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (mediaType === MediaType.audio) {
          if (ext === 'webm') finalMimeType = 'audio/webm';
          else if (ext === 'ogg') finalMimeType = 'audio/ogg';
          else if (ext === 'wav') finalMimeType = 'audio/wav';
          else if (ext === 'm4a') finalMimeType = 'audio/mp4';
          else finalMimeType = 'audio/mpeg'; // default to mp3
        } else {
          finalMimeType = 'video/mp4';
        }
      } else {
        // Fallback defaults
        finalMimeType = mediaType === MediaType.audio ? 'audio/mpeg' : 'video/mp4';
      }
      
      const blob = new Blob([bytes], { type: finalMimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      
      // Use provided filename or generate one with correct extension
      const defaultExt = getExtensionFromMimeType(finalMimeType);
      const defaultName = mediaType === MediaType.audio ? `audio.${defaultExt}` : `video.${defaultExt}`;
      link.download = fileName || defaultName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download {mediaType === MediaType.audio ? 'Audio' : 'Video'}
        </>
      )}
    </Button>
  );
}
