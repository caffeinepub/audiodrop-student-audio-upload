import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetSubmission } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AdminAudioPlayer from '../../components/admin/AdminAudioPlayer';
import AdminVideoPlayer from '../../components/admin/AdminVideoPlayer';
import AdminMediaDownloadButton from '../../components/admin/AdminMediaDownloadButton';
import DeleteSubmissionButton from '../../components/admin/DeleteSubmissionButton';
import { formatTimestamp, formatSubmissionIdDisplay } from '../../lib/submissionFormat';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { MediaType } from '../../backend';

export default function SubmissionDetailsPage() {
  const navigate = useNavigate();
  const { submissionId } = useParams({ from: '/admin/submissions/$submissionId' });
  const submissionIdBigInt = submissionId ? BigInt(submissionId) : null;
  const { data: submission, isLoading, error } = useGetSubmission(submissionIdBigInt);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate({ to: '/admin/dashboard' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load submission details. The submission may not exist or you may not have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { local, utc } = formatTimestamp(submission.submittedAtUtc);
  const displayId = formatSubmissionIdDisplay(submission.id);
  const isAudio = submission.mediaType === MediaType.audio;
  const isVideo = submission.mediaType === MediaType.video;

  // Determine file extension based on media type
  const fileExtension = isVideo ? 'mp4' : 'mp3';
  const downloadFilename = `${submission.studentId}_${submission.course}_${submission.assessment}.${fileExtension}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate({ to: '/admin/dashboard' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <DeleteSubmissionButton
          submissionId={submission.id}
          submissionIdDisplay={displayId}
        />
      </div>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Submission Details</h1>
          <Badge variant={isVideo ? 'default' : 'secondary'}>
            {isVideo ? 'Video' : 'Audio'}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono">{displayId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student ID</p>
              <p className="font-medium">{submission.studentId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="font-medium">{submission.course}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assessment</p>
              <p className="font-medium">{submission.assessment}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Media Type</p>
              <p className="font-medium capitalize">{submission.mediaType}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Submitted At (Local Time)</p>
              <p className="font-medium">{local}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted At (UTC)</p>
              <p className="font-medium">{utc}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAudio && <AdminAudioPlayer audio={submission.media} />}
      {isVideo && <AdminVideoPlayer video={submission.media} />}

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Download or manage this submission</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminMediaDownloadButton
            mediaBlob={submission.media}
            mediaType={submission.mediaType}
            fileName={downloadFilename}
          />
        </CardContent>
      </Card>
    </div>
  );
}
