# AudioDrop Frontend

Audio submission platform for students built on the Internet Computer.

## Features

- **Audio Recording & Upload**: In-browser recording or file upload
- **Student Submissions**: Simple form-based submission workflow
- **Admin Dashboard**: View, manage, and download submissions
- **Audit Logging**: Track all admin actions
- **Internet Identity**: Secure authentication via Internet Identity

## Architecture

### Technology Stack
- **React 19** with TypeScript
- **TanStack Router** for routing
- **TanStack Query** for server state management
- **Tailwind CSS** + shadcn/ui for styling
- **Internet Computer SDK** for backend integration

### Key Components
- `src/ic/agent.ts` - Shared HttpAgent factory (mainnet-only, ic0.app)
- `src/ic/actor.ts` - Backend actor creation and health checks
- `src/config.ts` - Actor configuration using shared agent
- `src/hooks/useActor.ts` - React hook for actor management
- `src/hooks/useQueries.ts` - React Query hooks for all backend operations

## Internet Computer Configuration

### Mainnet-Only Setup

This application is configured for **Internet Computer mainnet only**:

- **Host**: `https://ic0.app` (hardcoded, no alternatives)
- **No `fetchRootKey()` calls**: Mainnet uses verified root keys from the replica
- **No localhost support**: Local replica development is not supported

### Canister ID Configuration

The backend canister ID is hardcoded in `src/ic/actor.ts`:

