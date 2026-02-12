import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ExternalBlob } from '../../backend';
import { normalizeMimeType, getExtensionFromMimeType } from '../../lib/mediaMime';

interface AdminAudioDownloadButtonProps {
  audioBlob: ExternalBlob;
  fileName?: string;
  mimeType?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function AdminAudioDownloadButton({
  audioBlob,
  fileName,
  mimeType,
  variant = 'outline',
  size = 'sm',
}: AdminAudioDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const bytes = await audioBlob.getBytes();
      
      // Use provided MIME type or infer from filename, fallback to audio/mpeg
      let finalMimeType = 'audio/mpeg';
      if (mimeType) {
        finalMimeType = normalizeMimeType(mimeType);
      } else if (fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'webm') finalMimeType = 'audio/webm';
        else if (ext === 'ogg') finalMimeType = 'audio/ogg';
        else if (ext === 'wav') finalMimeType = 'audio/wav';
        else if (ext === 'm4a') finalMimeType = 'audio/mp4';
      }
      
      const blob = new Blob([bytes], { type: finalMimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      // Use provided filename or generate one with correct extension
      const downloadName = fileName || `audio.${getExtensionFromMimeType(finalMimeType)}`;
      link.download = downloadName;
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
          Download Audio
        </>
      )}
    </Button>
  );
}
