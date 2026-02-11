/**
 * Utilities for handling media MIME types and file extensions
 */

/**
 * Maps common MIME types to file extensions
 */
const MIME_TO_EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
};

/**
 * Maps file extensions to MIME types
 */
const EXT_TO_MIME: Record<string, string> = {
  'webm': 'audio/webm',
  'ogg': 'audio/ogg',
  'wav': 'audio/wav',
  'mp3': 'audio/mpeg',
  'm4a': 'audio/mp4',
  'mp4': 'video/mp4',
};

/**
 * Derives a file extension from a MIME type
 * @param mimeType - The MIME type (e.g., 'audio/webm')
 * @returns File extension without dot (e.g., 'webm'), defaults to 'bin' for unknown types
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  return MIME_TO_EXT[normalized] || 'bin';
}

/**
 * Derives a MIME type from a file extension or filename
 * @param fileNameOrExt - File name or extension (with or without dot)
 * @returns MIME type, defaults to 'application/octet-stream' for unknown types
 */
export function getMimeTypeFromExtension(fileNameOrExt: string): string {
  const ext = fileNameOrExt.includes('.') 
    ? fileNameOrExt.split('.').pop()?.toLowerCase() || ''
    : fileNameOrExt.toLowerCase();
  
  return EXT_TO_MIME[ext] || 'application/octet-stream';
}

/**
 * Infers MIME type from backend response fields
 * @param fileType - Backend fileType field (e.g., 'webm', 'wav')
 * @param fileName - Optional filename to extract extension from
 * @returns Inferred MIME type
 */
export function inferMimeType(fileType?: string, fileName?: string): string {
  if (fileType) {
    return getMimeTypeFromExtension(fileType);
  }
  if (fileName) {
    return getMimeTypeFromExtension(fileName);
  }
  return 'application/octet-stream';
}

/**
 * Normalizes a MIME type to a safe default if unknown
 * @param mimeType - The MIME type to normalize
 * @returns Normalized MIME type
 */
export function normalizeMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  if (normalized.startsWith('audio/') || normalized.startsWith('video/')) {
    return normalized;
  }
  return 'application/octet-stream';
}
