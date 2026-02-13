# Specification

## Summary
**Goal:** Fix the frontend/backend canister ID mismatch by centralizing the active backend canister ID in one shared frontend config source, removing stale IDs, and surfacing the active ID in the UI for easy verification.

**Planned changes:**
- Replace the outdated hardcoded backend canister ID (`bd3sg-teaaa-aaaaa-qaaba-cai`) with the current deployed backend canister ID from project backend settings across all frontend actor creation and health check usage.
- Add a single shared canister config module (e.g., `frontend/src/config/canisters.ts`) that exports the active backend canister ID, and refactor all backend call sites to read from it (student submit flow, admin dashboard/submission flows, and health checks).
- Remove any other stale/old hardcoded backend canister IDs in the frontend (including deprecated wrappers) so no conflicting runtime code paths remain.
- Add a small always-visible runtime UI banner that displays the active backend canister ID (sourced from the shared config module).
- Verify end-to-end that health check, student submission, and admin dashboard/submission views work without `canister_not_found` errors.

**User-visible outcome:** The app shows the active backend canister ID in a small banner, and core flows (health check on load, student submit, admin dashboard/submissions) successfully reach the backend without `canister_not_found`.
