import { useEffect, useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Square, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { formatDuration, MAX_RECORDING_DURATION } from '../lib/audioValidation';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    recordedBlob,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    error,
  } = useAudioRecorder();

  useEffect(() => {
    // Auto-stop at max duration
    if (isRecording && recordingTime >= MAX_RECORDING_DURATION) {
      stopRecording();
    }
  }, [isRecording, recordingTime, stopRecording]);

  const handleAttachRecording = () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      onRecordingComplete(file);
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
          {!isRecording && recordedBlob && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Recording complete</span>
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
            onClick={startRecording}
            disabled={disabled}
            className="flex-1"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && !isPaused && (
          <>
            <Button
              onClick={pauseRecording}
              variant="outline"
              className="flex-1"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </>
        )}

        {isRecording && isPaused && (
          <>
            <Button
              onClick={resumeRecording}
              variant="outline"
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </>
        )}

        {!isRecording && recordedBlob && (
          <>
            <Button
              onClick={clearRecording}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Re-record
            </Button>
            <Button
              onClick={handleAttachRecording}
              disabled={disabled}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Use This Recording
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
