# Specification

## Summary
**Goal:** Allow unauthenticated students to submit recordings from the public upload page while keeping all submission viewing/downloading and admin operations strictly admin-only.

**Planned changes:**
- Backend: Remove AccessControl permission requirements from `createSubmission()` (and any submission-create entrypoints) so unauthenticated callers can create submissions; store `submittedBy` as `null` (or equivalent) when no principal is available.
- Backend: Ensure all submission access and admin operations remain admin-only (list/view/details, play/stream/download, generate download links, bulk ZIP export, delete, settings, audit log) and return clear English unauthorized errors for non-admin callers.
- Backend: Keep/strengthen server-side validation for public submissions (required metadata fields, media allowlist with executable/unknown blocked, max size 25MB, duration limits if supported, and rate limiting ~10 submissions/hour per caller fingerprint/IP).
- Backend: Store uploaded media privately and ensure no public URLs/links are returned from public submission creation; any media retrieval remains admin-only.
- Frontend: Ensure the student public upload flow works end-to-end without login and, on success, shows only “Your recording has been submitted successfully.” with no playback, filename, download link, submission ID, timestamps, or any way to retrieve prior submissions.
- Media policy alignment (frontend + backend): Align to intended policy by either making the student flow audio-only (disable video UI and reject `#video` submissions) or, if audio+video remains supported, enforce explicit allowlists per media type.

**User-visible outcome:** Students can submit a recording from the public page without logging in and only see a generic success message; only admins can view, play, download, export, or manage any submissions.
