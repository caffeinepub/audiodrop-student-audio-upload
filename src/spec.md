# Specification

## Summary
**Goal:** Fix the deployed app incorrectly showing “Backend Offline” by initializing the Internet Computer backend actor using generated canister declarations and gating submission on a load-time health check.

**Planned changes:**
- Update frontend actor initialization to import `idlFactory` and `canisterId` from `declarations/backend`, remove any env-var or dynamic require/eval canister ID resolution, and create the actor via `Actor.createActor(idlFactory, { agent, canisterId })`.
- Configure the `HttpAgent` to use `https://icp0.io` when deployed, while keeping the local replica host for development.
- Wrap actor initialization in an async init flow that runs only after the browser `window` load event, and ensure all `getBackendActor()` consumers await initialization.
- Add/confirm a lightweight backend health check on initial page load (prefer `getVersion()`, otherwise `ping()`), showing exactly “Backend Offline” and disabling Submit while unhealthy, and enabling Submit once healthy.
- Verify the deployed submission flow works end-to-end: `createSubmission` succeeds using the initialized actor and the “Backend Offline” banner does not appear when the backend is reachable.

**User-visible outcome:** On the deployed site, the app no longer shows “Backend Offline” when the backend is reachable, and users can successfully submit audio via `createSubmission`; if the backend is unreachable, “Backend Offline” is shown and submission is blocked until healthy.
