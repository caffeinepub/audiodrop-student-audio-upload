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
import { useCreateSubmission, useGetAdminSettings, useBackendHealth } from '../hooks/useQueries';
import { isValidAudioFile, ALLOWED_AUDIO_EXTENSIONS } from '../lib/audioValidation';
import { ExternalBlob, MediaType } from '../backend';
import { Upload, FileAudio, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeMimeType } from '../lib/mediaMime';

export default function StudentUploadPage() {
  const navigate = useNavigate();
  const createSubmission = useCreateSubmission();
  const { data: settings } = useGetAdminSettings();
  const { data: isBackendHealthy, isLoading: isCheckingHealth } = useBackendHealth();

  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    course: '',
    assessment: '',
    email: '',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedAudioSource, setSelectedAudioSource] = useState<'upload' | 'recording' | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioValidationError, setAudioValidationError] = useState('');
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const captchaRequired = settings?.captchaEnabled ?? false;
  const backendOffline = isBackendHealthy === false;

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
      setSelectedAudioSource(null);
      return;
    }

    setAudioValidationError('');
    setAudioFile(file);
    setSelectedAudioSource('upload');
    toast.success('Audio file selected');
  };

  const handleRecordingComplete = (file: File) => {
    setAudioFile(file);
    setSelectedAudioSource('recording');
    setAudioValidationError('');
    toast.success(`Recording attached: ${file.name}`);
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
      (!captchaRequired || captchaPassed) &&
      isBackendHealthy === true
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

    // Check backend availability first
    if (backendOffline) {
      toast.error('Backend Offline. Please try again later.');
      return;
    }

    if (!isFormValid()) {
      if (captchaRequired && !captchaPassed) {
        setShowCaptcha(true);
        toast.error('Please complete the verification');
      } else if (backendOffline) {
        toast.error('Backend Offline. Cannot submit at this time.');
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }

    if (!audioFile) {
      toast.error('Please select or record an audio file');
      return;
    }

    try {
      setUploadProgress(0);

      // Convert File to Uint8Array
      const arrayBuffer = await audioFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with upload progress tracking
      const externalBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      // Normalize MIME type (remove codec parameters, fallback to audio/mpeg for MP3)
      const normalizedMimeType = normalizeMimeType(audioFile.type || 'audio/webm');

      // Submit to backend with individual parameters
      await createSubmission.mutateAsync({
        studentId: formData.studentId,
        course: formData.course,
        assessment: formData.assessment,
        media: externalBlob,
        mediaType: MediaType.audio,
        originalFileName: audioFile.name,
        mimeType: normalizedMimeType,
        sizeBytes: audioFile.size,
      });

      toast.success('Submission successful!');
      navigate({ to: '/success' });
    } catch (error: any) {
      console.error('Submission error:', error);
      
      if (error?.message?.includes('Backend not connected') || error?.message?.includes('actor')) {
        toast.error('Backend Offline. Cannot submit at this time.');
      } else if (error?.message?.includes('Unauthorized')) {
        toast.error('Authentication required. Please refresh and try again.');
      } else {
        toast.error(error?.message || 'Submission failed. Please try again.');
      }
    } finally {
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Backend Offline Banner */}
        {backendOffline && !isCheckingHealth && (
          <Alert variant="destructive" className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Backend Offline
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-2">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Submit Your Audio Recording
            </CardTitle>
            <CardDescription className="text-center text-base">
              Upload or record your audio submission for assessment
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Student Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID *</Label>
                    <Input
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      placeholder="12345678"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="student@university.edu"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course Code *</Label>
                    <Input
                      id="course"
                      name="course"
                      value={formData.course}
                      onChange={handleInputChange}
                      placeholder="CS101"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assessment">Assessment Name *</Label>
                    <Input
                      id="assessment"
                      name="assessment"
                      value={formData.assessment}
                      onChange={handleInputChange}
                      placeholder="Midterm Oral Exam"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Audio Upload/Recording Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Audio Submission *</h3>
                
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="record">
                      <FileAudio className="w-4 h-4 mr-2" />
                      Record Audio
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <Input
                        id="audioFile"
                        type="file"
                        accept={ALLOWED_AUDIO_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                        onChange={handleAudioFileChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="audioFile"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="w-12 h-12 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Supported formats: {ALLOWED_AUDIO_EXTENSIONS.join(', ').toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Max size: {settings?.maxAudioSizeMB || 25}MB
                        </span>
                      </Label>
                    </div>

                    {audioFile && selectedAudioSource === 'upload' && (
                      <Alert>
                        <FileAudio className="h-4 w-4" />
                        <AlertDescription>
                          Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                        </AlertDescription>
                      </Alert>
                    )}

                    {audioValidationError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{audioValidationError}</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="record" className="space-y-4">
                    <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                    
                    {audioFile && selectedAudioSource === 'recording' && (
                      <Alert>
                        <FileAudio className="h-4 w-4" />
                        <AlertDescription>
                          Recording attached: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="consent"
                  checked={consentConfirmed}
                  onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                />
                <Label
                  htmlFor="consent"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I confirm that this is my own work and I consent to this recording being used for
                  assessment purposes. I understand that this submission may be reviewed by course
                  instructors and teaching assistants.
                </Label>
              </div>

              {/* CAPTCHA Challenge */}
              {captchaRequired && showCaptcha && (
                <LocalCaptchaChallenge
                  onSuccess={handleCaptchaSuccess}
                  onFail={handleCaptchaFail}
                />
              )}

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full text-lg font-semibold"
                disabled={!isFormValid() || createSubmission.isPending || isCheckingHealth}
              >
                {createSubmission.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : isCheckingHealth ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Checking connection...
                  </>
                ) : backendOffline ? (
                  'Backend Offline'
                ) : (
                  'Submit Recording'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By submitting, you agree to our terms of service and privacy policy
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
