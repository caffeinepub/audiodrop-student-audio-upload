export const ALLOWED_AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.webm', '.ogg'];
export const ALLOWED_AUDIO_MIMETYPES = [
  'audio/mp4',
  'audio/x-m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/vorbis',
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const MAX_RECORDING_DURATION = 10 * 60; // 10 minutes in seconds

export function isValidAudioFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_AUDIO_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file type. Please upload one of: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`,
    };
  }

  // Check MIME type if available
  if (file.type && !ALLOWED_AUDIO_MIMETYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid audio format. Please upload one of: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
