/**
 * Audio decode/encode error types and helpers
 */

export class AudioFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioFormatError';
  }
}

export class AudioConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioConversionError';
  }
}

/**
 * Checks if an error is an audio format error
 */
export function isAudioFormatError(error: unknown): error is AudioFormatError {
  return error instanceof AudioFormatError;
}

/**
 * Checks if an error is an audio conversion error
 */
export function isAudioConversionError(error: unknown): error is AudioConversionError {
  return error instanceof AudioConversionError;
}

/**
 * Gets a user-friendly error message for audio format/conversion issues
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isAudioFormatError(error) || isAudioConversionError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    // Check for common Web Audio API errors
    if (error.name === 'EncodingError') {
      return 'Unable to decode the audio format. Please try recording again.';
    }
    if (error.name === 'NotSupportedError') {
      return 'This audio format is not supported by your browser.';
    }
    if (error.message.includes('decode')) {
      return 'Failed to decode audio data. The recording may be corrupted.';
    }
    return error.message;
  }
  return 'An unknown error occurred during audio processing.';
}
