import { convertToMp3 } from '../lib/ffmpeg/convertToMp3';

/**
 * Dev-only smoke test for FFmpeg.wasm MP3 conversion
 * Exposed on window.testFFmpeg in development mode
 */
export async function testFFmpegConversion(blob: Blob): Promise<void> {
  console.log('[FFmpeg Smoke Test] Starting conversion test...');
  console.log('[FFmpeg Smoke Test] Input blob:', {
    size: blob.size,
    type: blob.type,
  });

  try {
    const startTime = performance.now();
    const mp3Blob = await convertToMp3(blob);
    const endTime = performance.now();

    console.log('[FFmpeg Smoke Test] ✅ Conversion successful!');
    console.log('[FFmpeg Smoke Test] Output blob:', {
      size: mp3Blob.size,
      type: mp3Blob.type,
    });
    console.log('[FFmpeg Smoke Test] Conversion time:', `${(endTime - startTime).toFixed(2)}ms`);

    // Optionally trigger a download to verify the MP3
    const url = URL.createObjectURL(mp3Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_conversion_${Date.now()}.mp3`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('[FFmpeg Smoke Test] MP3 file downloaded for verification');
  } catch (error) {
    console.error('[FFmpeg Smoke Test] ❌ Conversion failed:', error);
    throw error;
  }
}

/**
 * Helper to create a test audio blob from MediaRecorder
 * Usage in console: window.testFFmpegWithRecording()
 */
export async function testFFmpegWithRecording(): Promise<void> {
  console.log('[FFmpeg Smoke Test] Starting audio recording for test...');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      console.log('[FFmpeg Smoke Test] Recording complete, starting conversion...');
      await testFFmpegConversion(blob);
    };

    mediaRecorder.start();
    console.log('[FFmpeg Smoke Test] Recording for 3 seconds...');

    setTimeout(() => {
      mediaRecorder.stop();
    }, 3000);
  } catch (error) {
    console.error('[FFmpeg Smoke Test] Failed to record audio:', error);
    throw error;
  }
}
