# Specification

## Summary
**Goal:** Convert in-browser recorder audio to MP3 (via FFmpeg.wasm) when the user attaches or submits a recording, without changing the uploaded-file flow.

**Planned changes:**
- On “Use This Recording”, run FFmpeg.wasm to convert the recorder-produced Blob to an MP3 at 128kbps CBR, then replace the selected/attached file with the resulting MP3.
- Ensure the attached MP3 is created with MIME type exactly `audio/mpeg` and a filename matching `recording-<timestamp>.mp3`.
- Update the FFmpeg conversion helper to enforce 128kbps constant bitrate (CBR) MP3 output and return a non-empty `audio/mpeg` Blob.
- On “Submit Recording”, submit the converted MP3 bytes for in-browser recordings, while leaving uploaded audio files unchanged (no conversion; preserve existing name/type behavior).

**User-visible outcome:** When recording in the browser and clicking “Use This Recording” (and then submitting), the app attaches/uploads an MP3 file (`audio/mpeg`, `recording-<timestamp>.mp3`). Uploaded audio files continue to upload as-is.
