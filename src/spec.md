# Specification

## Summary
**Goal:** Allow students to submit either an audio file or a video file (at least one required), and ensure admins can view/play back the correct media type.

**Planned changes:**
- Update the Student Upload form UI to support video file uploads alongside existing audio upload/recording, with validation enforcing at least one of {audio, video}.
- Update user-facing copy (English) to clarify that audio is not mandatory when a video is uploaded, and show accepted video formats and the 25MB max size near the video input.
- Add client-side video validation (allowed types + 25MB max) while keeping existing audio validation unchanged.
- Update the submission request logic to send either audio bytes or video bytes (with upload progress preserved) based on what the student provided.
- Extend the backend public submission API to accept audio and/or video, reject submissions with neither, and persist the submitted media type and associated blob reference.
- Update admin submission details to handle video submissions (video playback UI or clear message + download), while preserving existing audio playback and protected media access via backend calls.

**User-visible outcome:** Students can submit a project using either an audio file or a video file (without needing audio when video is provided), and admins can correctly play or download the submitted media type.
