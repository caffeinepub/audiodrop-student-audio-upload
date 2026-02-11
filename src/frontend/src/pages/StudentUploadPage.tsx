import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioRecorder from '../components/AudioRecorder';
import LocalCaptchaChallenge from '../components/LocalCaptchaChallenge';
import { useCreateSubmission, useGetAdminSettings } from '../hooks/useQueries';
import { isValidAudioFile, ALLOWED_AUDIO_EXTENSIONS } from '../lib/audioValidation';
import { ExternalBlob, MediaType } from '../backend';
import { Upload, FileAudio, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentUploadPage() {
  const navigate = useNavigate();
  const createSubmission = useCreateSubmission();
  const { data: settings } = useGetAdminSettings();

  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    course: '',
    assessment: '',
    email: '',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isFromRecording, setIsFromRecording] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioValidationError, setAudioValidationError] = useState('');
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const captchaRequired = settings?.captchaEnabled ?? false;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = isValidAudioFile(file);
    if (!validation.valid) {
      setAudioValidationError(validation.error || 'Invalid file');
      setAudioFile(null);
      setIsFromRecording(false);
      return;
    }

    setAudioValidationError('');
    setAudioFile(file);
    setIsFromRecording(false); // Uploaded file, not from recording
  };

  const handleRecordingComplete = (file: File) => {
    setAudioFile(file);
    setIsFromRecording(true); // Mark as from recording
    setAudioValidationError('');
    toast.success('Recording attached successfully');
  };

  const isFormValid = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.studentId.trim() !== '' &&
      formData.course.trim() !== '' &&
      formData.assessment.trim() !== '' &&
      formData.email.trim() !== '' &&
      audioFile !== null &&
      consentConfirmed &&
      (!captchaRequired || captchaPassed)
    );
  };

  const handleCaptchaSuccess = () => {
    setCaptchaPassed(true);
    setShowCaptcha(false);
    toast.success('Verification successful');
  };

  const handleCaptchaFail = () => {
    setCaptchaPassed(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      if (captchaRequired && !captchaPassed) {
        setShowCaptcha(true);
        toast.error('Please complete the verification challenge');
      } else if (!audioFile) {
        toast.error('Please upload or record an audio file');
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }

    if (!audioFile) {
      toast.error('Please upload or record an audio file');
      return;
    }

    // Validate file size before upload
    if (audioFile.size === 0) {
      toast.error('The audio file is empty. Please record or select a valid audio file.');
      return;
    }

    // For recordings, ensure it's an MP3 file
    if (isFromRecording) {
      if (audioFile.type !== 'audio/mpeg' || !audioFile.name.endsWith('.mp3')) {
        toast.error('Recording conversion failed. Please try recording again.');
        return;
      }
    }

    try {
      setUploadProgress(0);

      // Convert file to bytes
      const arrayBuffer = await audioFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Validate bytes are not empty
      if (bytes.length === 0) {
        toast.error('The audio file contains no data. Please try recording or uploading again.');
        return;
      }

      // Extract file metadata - use actual file type
      const originalFileName = audioFile.name;
      const mimeType = audioFile.type || 'application/octet-stream';
      const sizeBytes = audioFile.size;

      // Create ExternalBlob with progress tracking
      const externalBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      // Submit to backend with file metadata for durable storage
      await createSubmission.mutateAsync({
        studentId: formData.studentId,
        course: formData.course,
        assessment: formData.assessment,
        media: externalBlob,
        mediaType: MediaType.audio,
        originalFileName,
        mimeType,
        sizeBytes,
      });

      // Navigate to success page without passing any identifiers
      navigate({ to: '/success' });
    } catch (error: any) {
      console.error('Submission failed:', error);
      
      // Handle specific error types with clean, user-friendly messages
      if (error?.message?.includes('Upload failed')) {
        toast.error('Upload failed. Please try again.');
      } else if (error?.message?.includes('rate limit') || error?.message?.includes('too many')) {
        toast.error('You have exceeded the submission limit. Please try again later (10 submissions per hour maximum).');
      } else if (error?.message?.includes('storage') || error?.message?.includes('file')) {
        toast.error('Upload failed. Please try again.');
      } else {
        toast.error('Failed to submit. Please try again.');
      }
      setUploadProgress(0);
    }
  };

  const isSubmitting = createSubmission.isPending;

  if (showCaptcha && captchaRequired && !captchaPassed) {
    return (
      <div className="max-w-md mx-auto">
        <LocalCaptchaChallenge
          onSuccess={handleCaptchaSuccess}
          onFail={handleCaptchaFail}
        />
        <Button
          variant="ghost"
          onClick={() => setShowCaptcha(false)}
          className="w-full mt-4"
        >
          Back to Form
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Submit Your Recording</h1>
        <p className="text-muted-foreground">
          Please fill in all required fields and upload your audio file. Maximum file size is 25MB.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>All fields are required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID *</Label>
              <Input
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder="Enter your student ID"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Input
                id="course"
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                placeholder="e.g., COMP101"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment / Task *</Label>
              <Input
                id="assessment"
                name="assessment"
                value={formData.assessment}
                onChange={handleInputChange}
                placeholder="e.g., Assignment 1, Oral Exam"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio Submission</CardTitle>
            <CardDescription>
              Upload an audio file or record directly in your browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="record">Record Audio</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="audioFile">Audio File *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="audioFile"
                      type="file"
                      accept={ALLOWED_AUDIO_EXTENSIONS.join(',')}
                      onChange={handleAudioFileChange}
                      disabled={isSubmitting}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: MP3, WAV, M4A, OGG, WEBM (max 25MB)
                  </p>
                </div>

                {audioValidationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{audioValidationError}</AlertDescription>
                  </Alert>
                )}

                {audioFile && !audioValidationError && !isFromRecording && (
                  <Alert>
                    <FileAudio className="h-4 w-4" />
                    <AlertDescription>
                      File selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="record" className="space-y-4">
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  disabled={isSubmitting}
                />

                {audioFile && !audioValidationError && isFromRecording && (
                  <Alert>
                    <FileAudio className="h-4 w-4" />
                    <AlertDescription>
                      Recording attached: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consent & Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="consent"
                checked={consentConfirmed}
                onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                disabled={isSubmitting}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I confirm that this is my own work *
                </label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, you confirm that the submitted audio is your own original work.
                </p>
              </div>
            </div>

            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid() || isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
