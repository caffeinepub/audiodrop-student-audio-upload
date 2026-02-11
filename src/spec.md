# Specification

## Summary
**Goal:** Allow students to create submissions from the public upload flow without authentication by removing the backend `#user` permission requirement, while keeping all admin/submission-access operations locked to admins.

**Planned changes:**
- Update `backend/main.mo` to remove the `AccessControl.hasPermission(..., #user)` authorization trap from `createSubmission()` (and any other submission-create entrypoints, if present) so anonymous callers can create submissions.
- Ensure admin-only authorization remains enforced for all admin and submission-access operations (list/view submissions, media playback/download, delete, exports, settings, audit log), continuing to reject non-admin callers.

**User-visible outcome:** From the public Student Upload page (without logging in), students can submit a valid recording/upload successfully and reach the success page, without hitting an “Unauthorized” backend trap.
