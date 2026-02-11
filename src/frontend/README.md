# AudioDrop Frontend

Student audio submission platform with secure admin management.

## Features

### Student Experience
- **Public Upload Form**: No login required for students
- **Required Fields**: Full name, student ID, course, assessment, email
- **Audio Upload**: File upload (.mp3, .wav, .m4a, .webm, .ogg) up to 25MB
- **In-Browser Recording**: Optional 10-minute recording with pause/resume
- **Privacy-First**: Students cannot view, play, or download their submissions
- **Simple Confirmation**: Success message only, no submission details exposed

### Admin Experience
- **Secure Authentication**: Admin login required for all management features
- **Dashboard**: View all submissions with search and filtering
- **Submission Details**: Full student information and audio playback
- **Audio Management**: Play and download individual recordings
- **Export Tools**: CSV metadata export and ZIP bulk download (requires backend)
- **Audit Log**: Track admin actions (requires backend)
- **Settings**: Configure CAPTCHA and rate limiting (requires backend)

## Admin Setup

### First-Time Login
1. Navigate to `/admin/login`
2. Complete authentication
3. Set admin profile name (e.g., "OP Admin")
4. Access admin dashboard

### Admin Authentication
Currently uses Internet Identity for secure authentication. The system is designed to support password-based authentication once backend implementation is available.

**Note**: The backend needs to implement:
- Password-based admin authentication
- Session token management
- CSRF token generation and validation
- Single admin account ("OP Admin") with secure password storage

### Admin Capabilities
- View all student submissions
- Search by name, student ID, course, assessment, or email
- Play audio recordings securely
- Download individual audio files
- Export submission metadata to CSV
- Bulk download audio files as ZIP (requires backend)
- View audit log of admin actions (requires backend)
- Configure anti-spam settings (requires backend)

## Security Features

### Student Privacy
- No submission details exposed to students after upload
- Success page shows only confirmation message
- No re-access to submissions via URL or UI
- Audio files never accessible to students

### Admin Security
- Authentication required for all admin endpoints
- Role-based access control
- CSRF protection for state-changing actions (requires backend)
- Audit logging of admin actions (requires backend)
- Session management with secure tokens (requires backend)

### Rate Limiting
- 10 submissions per hour per IP (enforced by backend)
- Friendly error messages for rate-limited requests
- Optional CAPTCHA verification (configurable by admin)

## Audio Storage

Audio files are stored using the blob-storage component:
- Secure private storage (no public URLs)
- Support for files up to 25MB
- Streaming playback for admins
- Progress tracking during upload
- Efficient handling of large files

## Operational Limits

- **Max File Size**: 25MB
- **Max Recording Duration**: 10 minutes
- **Rate Limit**: 10 submissions per hour per IP
- **Allowed Formats**: mp3, wav, m4a, webm, ogg

## Architecture

### State Management
- React Query for server state and caching
- Local state with useState for UI controls
- Query invalidation on mutations

### Routing
- TanStack Router for type-safe routing
- Protected admin routes with authentication guard
- Public student upload route

### Components
- Modular component structure
- Shared UI components (shadcn/ui)
- Feature-specific components for admin and student flows

## Known Backend Gaps

The following features require backend implementation:

1. **Password-Based Admin Authentication**
   - Single admin account ("OP Admin")
   - Secure password hashing (bcrypt/argon2)
   - Session token generation and validation
   - CSRF token support

2. **Submission Metadata**
   - Store fullName and email fields
   - Audio metadata (mimeType, sizeBytes, durationSeconds, originalFileName)
   - Proper filename format: `studentId_course_assessment_yyyymmdd_hhmmss_random.ext`

3. **Admin Settings**
   - CAPTCHA toggle (default: off)
   - Rate limit configuration
   - Email notification settings

4. **Audit Logging**
   - Log admin login events
   - Log submission deletions
   - Log ZIP/CSV exports
   - Filterable by action type and date range

5. **Export Features**
   - Backend-filtered CSV export
   - ZIP bulk download with filtered audio files
   - Respect search/date range filters

6. **Rate Limiting**
   - Enforce 10 submissions per hour per IP
   - Return clear error messages
   - Track submission attempts

7. **Input Validation**
   - Reject submissions missing required fields
   - Validate audio file size (25MB max)
   - Validate audio MIME types
   - Sanitize text fields for safe rendering

## Development

### Prerequisites
- Node.js 18+
- pnpm

### Setup
