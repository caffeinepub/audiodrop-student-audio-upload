import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useActor } from '../../hooks/useActor';
import { downloadSubmission } from '../../lib/adminDownloads';
import { toast } from 'sonner';

interface AdminSubmissionDownloadButtonProps {
  submissionId: bigint;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function AdminSubmissionDownloadButton({
  submissionId,
  variant = 'outline',
  size = 'sm',
  className,
}: AdminSubmissionDownloadButtonProps) {
  const { actor } = useActor();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!actor) {
      toast.error('Not connected to backend');
      return;
    }

    setIsDownloading(true);
    try {
      await downloadSubmission({ submissionId, actor });
      toast.success('Download started');
    } catch (error: any) {
      console.error('Download failed:', error);
      const message = error?.message || 'Failed to download submission';
      toast.error(message);
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
      className={className}
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
