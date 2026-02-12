/**
 * Client-side MP3 conversion using Web Audio API and lamejs (loaded via CDN)
 */
import { AudioFormatError } from './audioDecodeErrors';

/**
 * Checks if a file is already MP3 format
 * @param file - File to check
 * @returns true if file is MP3, false otherwise
 */
export function isMP3File(file: File): boolean {
  const hasMP3Extension = file.name.toLowerCase().endsWith('.mp3');
  const hasMP3MimeType = file.type === 'audio/mpeg' || file.type === 'audio/mp3';
  return hasMP3Extension || hasMP3MimeType;
}

/**
 * Checks if the browser supports MP3 recording via MediaRecorder
 * @returns true if MP3 recording is supported
 */
export function isMP3RecordingSupported(): boolean {
  if (typeof MediaRecorder === 'undefined') {
    return false;
  }
  return MediaRecorder.isTypeSupported('audio/mpeg') || 
         MediaRecorder.isTypeSupported('audio/mp3');
}

/**
 * Gets the best supported MP3 MIME type for MediaRecorder
 * @returns MP3 MIME type string or null if not supported
 * @deprecated No longer used - recorder uses browser default format
 */
export function getMP3MimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') {
    return null;
  }
  
  const mp3Types = [
    'audio/mpeg',
    'audio/mp3',
  ];
  
  for (const type of mp3Types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return null;
}

/**
 * Ensures lamejs is loaded from CDN
 */
async function ensureLamejsLoaded(): Promise<void> {
  // Check if already loaded
  if (window.lamejs) {
    return;
  }

  // Check if script tag already exists
  const existingScript = document.querySelector('script[src*="lamejs"]');
  if (existingScript) {
    // Wait for it to load
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.lamejs) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.lamejs) {
          resolve();
        } else {
          reject(new Error('Timeout waiting for lamejs to load'));
        }
      }, 10000);
    });
  }

  // Load lamejs from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
    script.async = true;
    script.onload = () => {
      if (window.lamejs) {
        resolve();
      } else {
        reject(new Error('lamejs failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load lamejs from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Converts a recorded audio Blob (webm/ogg) to MP3 format using Web Audio API and lamejs
 * @param blob - The recorded audio blob (webm, ogg, etc.)
 * @param onProgress - Optional callback for conversion progress (0-100)
 * @returns Promise<Blob> - MP3 blob with MIME type 'audio/mpeg'
 */
export async function convertRecordedBlobToMp3(
  blob: Blob,
  onProgress?: (percentage: number) => void
): Promise<Blob> {
  let audioContext: AudioContext | null = null;

  try {
    // Ensure lamejs is loaded
    await ensureLamejsLoaded();
    
    if (!window.lamejs) {
      throw new AudioFormatError('MP3 encoder library failed to load. Please try again.');
    }

    // Report initial progress
    onProgress?.(0);

    // Step 1: Convert blob to ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    onProgress?.(10);

    // Step 2: Decode audio data using Web Audio API
    audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    onProgress?.(30);

    // Step 3: Extract PCM data and mix down to mono if stereo
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    let monoSamples: Float32Array;

    if (numberOfChannels === 1) {
      // Already mono
      monoSamples = audioBuffer.getChannelData(0);
    } else {
      // Mix stereo to mono by averaging channels
      monoSamples = new Float32Array(length);
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.getChannelData(1);
      
      for (let i = 0; i < length; i++) {
        monoSamples[i] = (leftChannel[i] + rightChannel[i]) / 2;
      }
    }
    onProgress?.(50);

    // Step 4: Convert Float32 samples to Int16 for lamejs
    const int16Samples = new Int16Array(monoSamples.length);
    for (let i = 0; i < monoSamples.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit integer
      const sample = Math.max(-1, Math.min(1, monoSamples[i]));
      int16Samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    onProgress?.(60);

    // Step 5: Encode to MP3 using lamejs (128kbps CBR, mono)
    const mp3Encoder = new window.lamejs.Mp3Encoder(1, sampleRate, 128);
    const mp3Data: BlobPart[] = [];
    const blockSize = 1152; // Standard MP3 frame size

    // Encode in blocks
    for (let i = 0; i < int16Samples.length; i += blockSize) {
      const sampleChunk = int16Samples.subarray(i, i + blockSize);
      const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
      
      if (mp3buf.length > 0) {
        // Create a new Uint8Array with proper ArrayBuffer to satisfy TypeScript
        const buffer = new Uint8Array(mp3buf.length);
        buffer.set(mp3buf);
        mp3Data.push(buffer);
      }

      // Report encoding progress (60-90%)
      const encodeProgress = 60 + (i / int16Samples.length) * 30;
      onProgress?.(Math.floor(encodeProgress));
    }

    // Flush remaining data
    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
      // Create a new Uint8Array with proper ArrayBuffer to satisfy TypeScript
      const buffer = new Uint8Array(mp3buf.length);
      buffer.set(mp3buf);
      mp3Data.push(buffer);
    }
    onProgress?.(95);

    // Step 6: Create MP3 Blob
    const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });
    onProgress?.(100);

    return mp3Blob;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'EncodingError' || error.message.includes('decode')) {
        throw new AudioFormatError(
          'Unable to decode audio format. The recording format may not be supported.'
        );
      }
      throw new AudioFormatError(`Conversion failed: ${error.message}`);
    }
    throw new AudioFormatError('An unknown error occurred during MP3 conversion.');
  } finally {
    // Always clean up AudioContext
    if (audioContext) {
      try {
        await audioContext.close();
      } catch (e) {
        console.warn('Failed to close AudioContext:', e);
      }
    }
  }
}

/**
 * Converts a recorded audio Blob to an MP3 File
 * @param blob - The recorded audio blob
 * @param baseName - Optional base name for the file (default: 'recording')
 * @param onProgress - Optional callback for conversion progress (0-100)
 * @returns Promise<File> - MP3 file with .mp3 extension and 'audio/mpeg' type
 */
export async function convertRecordedBlobToMp3File(
  blob: Blob,
  baseName: string = 'recording',
  onProgress?: (percentage: number) => void
): Promise<File> {
  const mp3Blob = await convertRecordedBlobToMp3(blob, onProgress);
  
  const timestamp = Date.now();
  const fileName = `${baseName}-${timestamp}.mp3`;
  
  return new File([mp3Blob], fileName, { type: 'audio/mpeg' });
}
