/**
 * Centralized Canister Configuration
 * 
 * This is the SINGLE SOURCE OF TRUTH for all backend canister IDs.
 * All actor creation, health checks, and backend calls MUST use this configuration.
 * 
 * IMPORTANT: Update BACKEND_CANISTER_ID with your actual deployed backend canister ID.
 * You can find your canister ID by running: dfx canister id backend --network ic
 * Or check your project's canister_ids.json file.
 */

/**
 * Backend canister ID for Internet Computer mainnet.
 * 
 * REPLACE THIS with your actual deployed backend canister ID.
 * Format: xxxxx-xxxxx-xxxxx-xxxxx-cai
 * 
 * Example: bkyz2-fmaaa-aaaaa-qaaaq-cai
 */
export const BACKEND_CANISTER_ID = 'bd3sg-teaaa-aaaaa-qaaba-cai';

/**
 * Get the backend canister ID.
 * This is the primary accessor used throughout the application.
 */
export function getBackendCanisterId(): string {
  return BACKEND_CANISTER_ID;
}

/**
 * Validate that the canister ID is in the correct format.
 * Returns true if the ID appears to be a valid IC principal.
 */
export function isValidCanisterId(canisterId: string): boolean {
  // Basic validation: should contain dashes and end with -cai
  return canisterId.length > 0 && 
         canisterId.includes('-') && 
         canisterId.endsWith('-cai');
}

/**
 * Get canister ID validation status.
 * Useful for runtime diagnostics and debugging.
 */
export function getCanisterIdStatus(): {
  canisterId: string;
  isValid: boolean;
  message: string;
} {
  const canisterId = BACKEND_CANISTER_ID;
  const isValid = isValidCanisterId(canisterId);
  
  return {
    canisterId,
    isValid,
    message: isValid 
      ? 'Canister ID format is valid' 
      : 'Canister ID format is invalid - please check configuration',
  };
}
