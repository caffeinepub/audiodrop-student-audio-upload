# AudioDrop Frontend

A modern web application for students to submit audio and video recordings, with a comprehensive admin dashboard for managing submissions.

## Features

### Student Features
- **Audio & Video Upload**: Students can upload pre-recorded audio or video files
- **In-Browser Recording**: Optional in-browser audio recording with pause/resume functionality
- **Required Metadata**: Student ID, course, and assessment information
- **Privacy-First**: No submission tracking or identifiers exposed to students
- **CAPTCHA Protection**: Optional math-based CAPTCHA to prevent spam

### Admin Features
- **Dashboard**: View and manage all submissions with search and filtering
- **Media Playback**: Stream audio and video directly in the browser
- **Download**: Download individual media files
- **Export Tools**: Export submission metadata as CSV
- **Settings**: Configure CAPTCHA, rate limits, and upload limits
- **Audit Log**: Track admin actions and system events
- **Secure Authentication**: Hardcoded admin credentials for secure access

## Admin Authentication

Admin authentication uses hardcoded credentials:

- **Username**: OP Admin
- **Password**: Hellyea11

Access the admin panel at `/admin/login` and use these credentials to log in.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Routing**: TanStack Router
- **State Management**: React Query (TanStack Query)
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with OKLCH color system
- **Backend**: Motoko canister on Internet Computer
- **Authentication**: Internet Identity (for students) + hardcoded admin credentials

## Project Structure

