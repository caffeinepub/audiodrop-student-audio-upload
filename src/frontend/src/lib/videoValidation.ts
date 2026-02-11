export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
];
export const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB in bytes

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}

export function isValidVideoFile(file: File): VideoValidationResult {
  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `Video file is too large. Maximum size is ${formatFileSize(MAX_VIDEO_SIZE)}.`,
    };
  }

  // Check MIME type
  if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid video format. Accepted formats: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid video file extension. Accepted formats: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`,
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
