/**
 * FFmpeg.wasm MP3 conversion helper
 * 
 * IMPORTANT: This module requires the following dependencies to be installed:
 * - @ffmpeg/ffmpeg@^0.12.6
 * - @ffmpeg/util@^0.12.1
 * 
 * Add to package.json dependencies:
 * "@ffmpeg/ffmpeg": "^0.12.6",
 * "@ffmpeg/util": "^0.12.1"
 */

// Type declarations for FFmpeg packages
interface FFmpegLoadConfig {
  coreURL: string;
  wasmURL: string;
}

interface FFmpeg {
  loaded: boolean;
  load(config: FFmpegLoadConfig): Promise<void>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  readFile(path: string): Promise<Uint8Array>;
  deleteFile(path: string): Promise<void>;
  exec(args: string[]): Promise<void>;
}

interface FFmpegConstructor {
  new (): FFmpeg;
}

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let loadError: Error | null = null;

/**
 * Dynamically imports FFmpeg packages
 * Uses dynamic import with string interpolation to bypass TypeScript module resolution
 */
async function importFFmpeg(): Promise<{
  FFmpeg: FFmpegConstructor;
  toBlobURL: (url: string, mimeType: string) => Promise<string>;
}> {
  try {
    // Use Function constructor to bypass TypeScript's static analysis
    const importModule = new Function('specifier', 'return import(specifier)');
    
    const ffmpegModule = await importModule('@ffmpeg/ffmpeg');
    const utilModule = await importModule('@ffmpeg/util');
    
    return {
      FFmpeg: ffmpegModule.FFmpeg,
      toBlobURL: utilModule.toBlobURL,
    };
  } catch (error) {
    throw new Error(
      'FFmpeg packages not installed. Please add @ffmpeg/ffmpeg and @ffmpeg/util to package.json dependencies.'
    );
  }
}

/**
 * Lazily initializes and loads FFmpeg.wasm
 * Returns the singleton FFmpeg instance
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  if (loadError) {
    throw loadError;
  }

  if (isLoading) {
    // Wait for the current load to complete
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (ffmpegInstance && ffmpegInstance.loaded) {
      return ffmpegInstance;
    }
    if (loadError) {
      throw loadError;
    }
  }

  isLoading = true;

  try {
    const { FFmpeg, toBlobURL } = await importFFmpeg();
    const ffmpeg = new FFmpeg();

    // Load FFmpeg core from CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    isLoading = false;
    return ffmpeg;
  } catch (error) {
    isLoading = false;
    loadError = error instanceof Error ? error : new Error('Failed to load FFmpeg');
    throw loadError;
  }
}

/**
 * Converts an audio Blob to MP3 format using FFmpeg.wasm at 128kbps CBR
 * @param blob - Input audio Blob (any format supported by FFmpeg)
 * @returns Promise<Blob> - Output MP3 Blob with type "audio/mpeg"
 * @throws Error if conversion fails
 */
export async function convertToMp3(blob: Blob): Promise<Blob> {
  if (!blob || blob.size === 0) {
    throw new Error('Failed to convert audio to MP3: Input blob is empty');
  }

  try {
    const ffmpeg = await getFFmpeg();

    // Generate unique filenames for this conversion
    const inputFileName = `input_${Date.now()}.webm`;
    const outputFileName = `output_${Date.now()}.mp3`;

    // Convert Blob to Uint8Array
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Write input file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile(inputFileName, uint8Array);

    // Run FFmpeg conversion: input -> MP3 with 128kbps CBR (constant bitrate)
    // -b:a 128k: target bitrate
    // -minrate 128k -maxrate 128k: enforce constant bitrate (no VBR)
    // -codec:a libmp3lame: use LAME MP3 encoder
    await ffmpeg.exec([
      '-i',
      inputFileName,
      '-codec:a',
      'libmp3lame',
      '-b:a',
      '128k',
      '-minrate',
      '128k',
      '-maxrate',
      '128k',
      outputFileName,
    ]);

    // Read the output file
    const data = await ffmpeg.readFile(outputFileName);

    // Clean up files from virtual filesystem
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (cleanupError) {
      console.warn('Failed to clean up FFmpeg files:', cleanupError);
    }

    // Convert Uint8Array to Blob with correct MIME type
    // Create a new Uint8Array with a proper ArrayBuffer to satisfy TypeScript
    const outputData = new Uint8Array(data);
    const mp3Blob = new Blob([outputData], { type: 'audio/mpeg' });

    if (mp3Blob.size === 0) {
      throw new Error('Failed to convert audio to MP3: Output file is empty');
    }

    return mp3Blob;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to convert audio to MP3: ${message}`);
  }
}
