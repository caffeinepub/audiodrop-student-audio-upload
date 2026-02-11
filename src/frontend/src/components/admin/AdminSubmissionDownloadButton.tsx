import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActor } from '../../hooks/useActor';
import { downloadSubmission } from '../../lib/adminDownloads';

interface AdminSubmissionDownloadButtonProps {
  submissionId: bigint;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function AdminSubmissionDownloadButton({ 
  submissionId,
  variant = 'outline',
  size = 'sm'
}: AdminSubmissionDownloadButtonProps) {
  const { actor } = useActor();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!actor) {
      toast.error('Unable to download. Please refresh the page and try again.');
      return;
    }

    try {
      setIsDownloading(true);
      
      const result = await downloadSubmission(actor, submissionId);
      
      if (result.success) {
        toast.success('Audio file downloaded successfully');
      } else {
        toast.error(result.error || 'Failed to download file');
      }
    } catch (error) {
      console.error('Unexpected download error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant={variant}
      size={size}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download
        </>
      )}
    </Button>
  );
}
