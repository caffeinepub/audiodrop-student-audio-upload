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
import { isValidVideoFile, ALLOWED_VIDEO_EXTENSIONS, MAX_VIDEO_SIZE, formatFileSize } from '../lib/videoValidation';
import { generateSubmissionId } from '../lib/submissionFormat';
import { ExternalBlob, MediaType } from '../backend';
import { Upload, FileAudio, FileVideo, Loader2, AlertCircle } from 'lucide-react';
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioValidationError, setAudioValidationError] = useState('');
  const [videoValidationError, setVideoValidationError] = useState('');
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
      return;
    }

    setAudioValidationError('');
    setAudioFile(file);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = isValidVideoFile(file);
    if (!validation.valid) {
      setVideoValidationError(validation.error || 'Invalid file');
      setVideoFile(null);
      return;
    }

    setVideoValidationError('');
    setVideoFile(file);
  };

  const handleRecordingComplete = (file: File) => {
    setAudioFile(file);
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
      (audioFile !== null || videoFile !== null) && // At least one media file required
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
      } else if (!audioFile && !videoFile) {
        toast.error('Please upload or record audio, or upload a video file');
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }

    if (!audioFile && !videoFile) {
      toast.error('Please upload or record audio, or upload a video file');
      return;
    }

    try {
      setUploadProgress(0);

      // Determine which media to submit (prefer video if both are present)
      const mediaFile = videoFile || audioFile;
      const mediaType: MediaType = videoFile ? MediaType.video : MediaType.audio;

      if (!mediaFile) {
        toast.error('No media file selected');
        return;
      }

      // Convert file to bytes
      const arrayBuffer = await mediaFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with progress tracking
      const externalBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      // Generate submission ID
      const submissionId = generateSubmissionId();

      // Submit to backend
      await createSubmission.mutateAsync({
        id: submissionId,
        fullName: formData.fullName,
        studentId: formData.studentId,
        course: formData.course,
        assessment: formData.assessment,
        email: formData.email,
        media: externalBlob,
        mediaType: mediaType,
      });

      // Navigate to success page without passing any identifiers
      navigate({ to: '/success' });
    } catch (error: any) {
      console.error('Submission failed:', error);
      
      // Handle rate limit errors
      if (error?.message?.includes('rate limit') || error?.message?.includes('too many')) {
        toast.error('You have exceeded the submission limit. Please try again later (10 submissions per hour maximum).');
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
          Please fill in all required fields and upload your audio or video file. Maximum file size is 25MB.
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
            <CardTitle>Media Upload *</CardTitle>
            <CardDescription>
              Submit either an audio recording or a video file (at least one is required)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="audio" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
              </TabsList>
              
              <TabsContent value="audio" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="audioFile">Upload Audio File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="audioFile"
                      type="file"
                      accept={ALLOWED_AUDIO_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                      onChange={handleAudioFileChange}
                      disabled={isSubmitting}
                      className="flex-1"
                    />
                    {audioFile && (
                      <FileAudio className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: {ALLOWED_AUDIO_EXTENSIONS.join(', ')} (max 25MB)
                  </p>
                  {audioValidationError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{audioValidationError}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or record audio
                    </span>
                  </div>
                </div>

                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  disabled={isSubmitting}
                />
              </TabsContent>
              
              <TabsContent value="video" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="videoFile">Upload Video File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="videoFile"
                      type="file"
                      accept={ALLOWED_VIDEO_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                      onChange={handleVideoFileChange}
                      disabled={isSubmitting}
                      className="flex-1"
                    />
                    {videoFile && (
                      <FileVideo className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: {ALLOWED_VIDEO_EXTENSIONS.join(', ')} (max {formatFileSize(MAX_VIDEO_SIZE)})
                  </p>
                  {videoValidationError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{videoValidationError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {(audioFile || videoFile) && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {videoFile ? (
                    <>Video file selected: <strong>{videoFile.name}</strong></>
                  ) : (
                    <>Audio file selected: <strong>{audioFile?.name}</strong></>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consentConfirmed}
                onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                disabled={isSubmitting}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I confirm that this is my own work and I consent to its submission *
                </Label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, you acknowledge that the recording is your original work
                  and you have the right to submit it.
                </p>
              </div>
            </div>

            {captchaRequired && !captchaPassed && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Verification is required before submission. Click Submit to complete the verification challenge.
                </AlertDescription>
              </Alert>
            )}

            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <Button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
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
