import { useEffect, useState, useRef } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Square, Play, Pause, RotateCcw, Check, Volume2, AlertCircle } from 'lucide-react';
import { formatDuration, MAX_RECORDING_DURATION } from '../lib/audioValidation';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ 
  onRecordingComplete, 
  disabled 
}: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    recordedBlob,
    recordedMimeType,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    error,
  } = useAudioRecorder();

  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [hasAttached, setHasAttached] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create preview URL when recording is complete
  useEffect(() => {
    if (recordedBlob && !isRecording) {
      // Revoke previous URL if exists
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      const url = URL.createObjectURL(recordedBlob);
      setRecordedUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (!recordedBlob) {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      setRecordedUrl(null);
    }
  }, [recordedBlob, isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-stop at max duration
    if (isRecording && recordingTime >= MAX_RECORDING_DURATION) {
      stopRecording();
    }
  }, [isRecording, recordingTime, stopRecording]);

  const handleUseThisRecording = () => {
    if (!recordedBlob) {
      toast.error('No recording available. Please record audio first.');
      return;
    }

    try {
      // Create a File from the recorded blob
      const file = new File(
        [recordedBlob], 
        `recording-${Date.now()}.webm`, 
        { type: recordedBlob.type || 'audio/webm' }
      );

      // Pass the File to parent
      onRecordingComplete(file);
      setHasAttached(true);
      toast.success('Recording attached successfully');
    } catch (err) {
      console.error('Error attaching recording:', err);
      toast.error('Failed to attach recording. Please try again.');
    }
  };

  const handleClearRecording = () => {
    clearRecording();
    setHasAttached(false);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  if (!isSupported) {
    return (
      <Alert>
        <AlertDescription>
          Audio recording is not supported in your browser. Please use the file upload option instead.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">In-Browser Recording</h3>
        <p className="text-xs text-muted-foreground">
          Record audio directly in your browser (max {Math.floor(MAX_RECORDING_DURATION / 60)} minutes)
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium">Recording</span>
            </div>
          )}
          {!isRecording && recordedBlob && !hasAttached && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Recording complete</span>
            </div>
          )}
          {!isRecording && recordedBlob && hasAttached && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Recording attached</span>
            </div>
          )}
          {!isRecording && !recordedBlob && (
            <span className="text-sm text-muted-foreground">Ready to record</span>
          )}
        </div>
        <div className="text-2xl font-mono font-bold">
          {formatDuration(recordingTime)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isRecording && !recordedBlob && (
          <Button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            variant="default"
          >
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && !isPaused && (
          <>
            <Button
              type="button"
              onClick={pauseRecording}
              disabled={disabled}
              variant="secondary"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button
              type="button"
              onClick={stopRecording}
              disabled={disabled}
              variant="destructive"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}

        {isRecording && isPaused && (
          <>
            <Button
              type="button"
              onClick={resumeRecording}
              disabled={disabled}
              variant="default"
            >
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
            <Button
              type="button"
              onClick={stopRecording}
              disabled={disabled}
              variant="destructive"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}

        {!isRecording && recordedBlob && (
          <>
            <Button
              type="button"
              onClick={handleClearRecording}
              disabled={disabled}
              variant="outline"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Re-record
            </Button>
            {!hasAttached && (
              <Button
                type="button"
                onClick={handleUseThisRecording}
                disabled={disabled}
                variant="default"
              >
                <Check className="mr-2 h-4 w-4" />
                Use This Recording
              </Button>
            )}
          </>
        )}
      </div>

      {recordedUrl && !isRecording && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Preview</span>
          </div>
          <audio
            ref={audioRef}
            src={recordedUrl}
            controls
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
