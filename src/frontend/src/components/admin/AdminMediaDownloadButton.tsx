import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ExternalBlob, MediaType } from '../../backend';

interface AdminMediaDownloadButtonProps {
  media: ExternalBlob;
  mediaType: MediaType;
  filename: string;
}

export default function AdminMediaDownloadButton({ 
  media, 
  mediaType, 
  filename 
}: AdminMediaDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Get media bytes
      const bytes = await media.getBytes();
      
      // Determine MIME type based on media type
      const mimeType = mediaType === 'audio' ? 'audio/webm' : 'video/webm';
      const blob = new Blob([bytes], { type: mimeType });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`${mediaType === 'audio' ? 'Audio' : 'Video'} file downloaded successfully`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download ${mediaType} file. Please try again.`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant="outline"
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download {mediaType === 'audio' ? 'Audio' : 'Video'}
        </>
      )}
    </Button>
  );
}
