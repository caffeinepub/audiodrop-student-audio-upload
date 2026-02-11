# AudioDrop Frontend

A modern web application for managing student audio and video submissions with a secure admin dashboard.

## Features

### Student Features
- **Audio-only submission** (video support removed from public upload)
- In-browser audio recording with pause/resume
- File upload with drag-and-drop support
- Real-time upload progress tracking
- Privacy-first: No submission identifiers shown to students
- Simple success confirmation after submission

### Admin Features
- **Session-based authentication** with hardcoded credentials
  - Username: `OP Admin`
  - Password: `admin123`
- Submissions dashboard with search and filtering
- Detailed submission view with media playback
- Audio and video playback with streaming support
- Media download functionality
- CSV metadata export
- Delete submissions with confirmation
- Settings page (placeholder for future features)
- Audit log (placeholder for future features)

### Security Features
- Session-based admin authentication (backend + client-side)
- Constant-time password comparison
- Session expiration (24 hours)
- CSRF protection helpers (for future use)
- XSS prevention with text sanitization
- Secure media streaming via ExternalBlob

## Architecture

### Tech Stack
- **React 19** with TypeScript
- **TanStack Router** for routing
- **TanStack Query** for server state management
- **Tailwind CSS** with OKLCH color system
- **shadcn/ui** components
- **Internet Computer** backend (Motoko)

### Key Components
- `StudentUploadPage`: Public audio submission form
- `AdminDashboardPage`: Admin submissions management
- `AdminLoginPage`: Admin authentication
- `SubmissionDetailsPage`: Detailed submission view
- `AdminRouteGuard`: Route protection for admin pages

### State Management
- React Query for server state and caching
- Session storage for admin session tracking
- Backend session management via `adminLogin`/`adminLogout`

### Admin Authentication Flow
1. User enters credentials on `/admin/login`
2. Frontend validates credentials client-side
3. Frontend calls `actor.adminLogin(password)` to establish backend session
4. Backend sets `session.role = "admin"` for the caller's Principal
5. Client stores session info in `sessionStorage`
6. All admin endpoints check `session.role === "admin"` on backend
7. Logout calls `actor.adminLogout()` to clear backend session

## Development

### Prerequisites
- Node.js 18+
- pnpm
- dfx (Internet Computer SDK)

### Setup
