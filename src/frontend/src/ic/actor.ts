import { Actor } from '@dfinity/agent';
import type { backendInterface } from '../backend';
import { idlFactory } from '../backend.did';
import { createAgent, getAnonymousAgent } from './agent';
import { getBackendCanisterId } from '../config/canisters';

/**
 * MAINNET-ONLY ACTOR FACTORY
 * 
 * This module provides the single source of truth for backend actor creation.
 * Configuration is hardcoded for Internet Computer mainnet:
 * - Host: https://ic0.app (via shared agent, fixed, no alternatives)
 * - No fetchRootKey() calls (mainnet uses verified root keys from the replica)
 * - No localhost or local replica support
 * - Canister ID: Sourced from centralized config/canisters.ts
 */

/**
 * Export the canister ID for use by other modules.
 * This delegates to the centralized canister configuration.
 */
export const getCanisterId = (): string => getBackendCanisterId();

/**
 * Create a backend actor with optional identity.
 * This is the single source of truth for actor creation.
 * Always uses https://ic0.app as the host (via shared agent).
 * NEVER calls fetchRootKey() - mainnet uses verified root keys.
 * 
 * @param identity - Optional identity for authenticated calls
 * @returns Backend actor instance
 */
export async function createBackendActor(identity?: any): Promise<backendInterface> {
  const canisterId = getBackendCanisterId();
  
  // Create HTTP agent using shared factory (always ic0.app, no fetchRootKey)
  const agent = createAgent(identity);

  // Create actor using the IDL factory, explicit agent, and centralized canister ID
  const actor = Actor.createActor<backendInterface>(idlFactory, {
    agent,
    canisterId,
  });

  return actor;
}

// Cached anonymous actor for reuse
let cachedAnonymousActor: backendInterface | null = null;

/**
 * Get or create an anonymous backend actor.
 * Uses caching to avoid recreating the actor on every call.
 */
export async function getAnonymousActor(): Promise<backendInterface> {
  if (!cachedAnonymousActor) {
    const canisterId = getBackendCanisterId();
    
    // Use shared anonymous agent
    const agent = getAnonymousAgent();
    
    cachedAnonymousActor = Actor.createActor<backendInterface>(idlFactory, {
      agent,
      canisterId,
    });
  }
  return cachedAnonymousActor;
}

/**
 * Reset the cached anonymous actor.
 * Call this when you need to force recreation (e.g., after network changes).
 */
export function resetAnonymousActor(): void {
  cachedAnonymousActor = null;
}

/**
 * Perform a health check using the backend's health() method.
 * Returns { online: true } on success, or { online: false, error: string } on failure.
 * 
 * This function logs diagnostic information to help verify mainnet configuration.
 */
export async function checkHealth(): Promise<{ online: boolean; error?: string }> {
  const canisterId = getBackendCanisterId();
  
  try {
    console.log('[Health Check] Starting backend health check...');
    console.log('[Health Check] Configuration:', {
      host: 'https://ic0.app',
      canisterId,
      fetchRootKey: 'NEVER (mainnet uses verified root keys)',
    });
    
    const actor = await getAnonymousActor();
    const result = await actor.health();
    
    if (result === 'ok') {
      console.log('[Health Check] ✓ Backend is online and responding');
      return { online: true };
    }
    
    console.warn('[Health Check] ✗ Unexpected health response:', result);
    return { online: false, error: `Unexpected health response: ${result}` };
  } catch (error: any) {
    console.error('[Health Check] ✗ Health check failed:', error);
    
    // Enhanced error message with canister ID for debugging
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const detailedError = `${errorMessage} (Canister ID: ${canisterId})`;
    
    return { 
      online: false, 
      error: detailedError,
    };
  }
}
