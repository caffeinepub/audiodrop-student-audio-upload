/**
 * Utilities for mapping between MIME types and file extensions
 * with normalization support for codec parameters
 */

/**
 * Normalizes a MIME type by removing codec parameters
 * e.g., "audio/webm;codecs=opus" -> "audio/webm"
 */
export function normalizeMimeType(mimeType: string): string {
  if (!mimeType) return 'audio/mpeg'; // Default fallback for empty/undefined
  return mimeType.split(';')[0].trim();
}

/**
 * Maps file extensions to MIME types
 */
const extensionToMimeType: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
};

/**
 * Maps MIME types to file extensions
 */
const mimeTypeToExtension: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
};

/**
 * Gets the file extension from a MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const normalized = normalizeMimeType(mimeType);
  return mimeTypeToExtension[normalized] || 'bin';
}

/**
 * Gets the MIME type from a file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const ext = extension.toLowerCase().replace(/^\./, '');
  return extensionToMimeType[ext] || 'application/octet-stream';
}

/**
 * Infers MIME type from backend response fields
 * Priority: metadata.mimeType > fileType > filename extension
 */
export function inferMimeType(
  metadataMimeType?: string,
  fileType?: string,
  filename?: string
): string {
  // Try metadata MIME type first
  if (metadataMimeType) {
    return normalizeMimeType(metadataMimeType);
  }

  // Try fileType field
  if (fileType) {
    return normalizeMimeType(fileType);
  }

  // Try to infer from filename extension
  if (filename) {
    const match = filename.match(/\.([^.]+)$/);
    if (match) {
      const ext = match[1].toLowerCase();
      return getMimeTypeFromExtension(ext);
    }
  }

  // Default fallback
  return 'application/octet-stream';
}

/**
 * Gets a safe filename with correct extension for the MIME type
 */
export function getSafeFilename(
  baseFilename: string,
  mimeType: string
): string {
  const normalized = normalizeMimeType(mimeType);
  const correctExtension = getExtensionFromMimeType(normalized);
  
  // Remove existing extension if present
  const nameWithoutExt = baseFilename.replace(/\.[^.]+$/, '');
  
  return `${nameWithoutExt}.${correctExtension}`;
}
