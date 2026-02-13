import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';
import { useCreateSubmission, useBackendHealth } from '../hooks/useQueries';
import { ExternalBlob, MediaType } from '../backend';
import { isValidAudioFile } from '../lib/audioValidation';
import { toast } from 'sonner';
import { getBackendCanisterId } from '../config/canisters';

export default function StudentUploadPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [assessment, setAssessment] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createSubmission = useCreateSubmission();
  const { data: healthStatus } = useBackendHealth();

  const isBackendOffline = healthStatus && !healthStatus.online;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = isValidAudioFile(file);
    if (!validation.valid) {
      toast.error('Invalid audio file', {
        description: validation.error,
      });
      return;
    }

    setAudioFile(file);
  };

  const handleRecordingComplete = (file: File) => {
    setAudioFile(file);
    toast.success('Recording attached', {
      description: 'Your recording is ready to submit',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioFile) {
      toast.error('No audio file', {
        description: 'Please upload or record an audio file',
      });
      return;
    }

    if (isBackendOffline) {
      const canisterId = getBackendCanisterId();
      toast.error('Backend offline', {
        description: `Cannot submit while backend is offline. Canister: ${canisterId}`,
        duration: 5000,
      });
      return;
    }

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await createSubmission.mutateAsync({
        studentId,
        course,
        assessment,
        media: blob,
        metadata: {
          filename: audioFile.name,
          mimeType: audioFile.type || 'audio/mpeg',
          sizeBytes: BigInt(audioFile.size),
        },
        mediaType: MediaType.audio,
      });

      toast.success('Submission successful!');
      navigate({ to: '/success' });
    } catch (error: any) {
      console.error('Submission error:', error);
      const canisterId = getBackendCanisterId();
      toast.error('Submission failed', {
        description: error?.message || `Failed to submit recording. Canister: ${canisterId}`,
        duration: 5000,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Submit Your Audio Recording</CardTitle>
          <CardDescription>
            Upload an audio file or record directly in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBackendOffline && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Backend Connection Issue</div>
                <div className="text-sm mt-1">
                  {healthStatus.error || 'Unable to connect to backend'}
                </div>
                <div className="text-xs mt-1 opacity-75">
                  Canister: {getBackendCanisterId()}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your student ID"
                required
                disabled={createSubmission.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g., MUSIC 101"
                required
                disabled={createSubmission.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment</Label>
              <Input
                id="assessment"
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="e.g., Final Performance"
                required
                disabled={createSubmission.isPending}
              />
            </div>

            <div className="space-y-4">
              <Label>Audio Recording</Label>
              
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or upload a file</span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  id="audioFile"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={createSubmission.isPending}
                />
                {audioFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {audioFile.name}
                  </p>
                )}
              </div>
            </div>

            {createSubmission.isPending && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={createSubmission.isPending || !audioFile || isBackendOffline}
            >
              {createSubmission.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Recording
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
