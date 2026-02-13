import { getAnonymousActor, createBackendActor, checkHealth } from '../ic/actor';
import type { backendInterface } from '../backend';

/**
 * @deprecated Use getAnonymousActor from '../ic/actor' instead.
 * This module is kept for backward compatibility and delegates to the shared actor factory.
 * All actor creation now uses the centralized canister ID from config/canisters.ts.
 */

/**
 * Creates and returns a backend actor instance.
 * Now delegates to the shared actor factory with centralized canister configuration.
 * 
 * @param identity - Optional identity for authenticated calls
 * @returns Promise resolving to the backend actor
 */
export async function getBackendActor(identity?: any): Promise<backendInterface> {
  if (identity) {
    return await createBackendActor(identity);
  }
  return await getAnonymousActor();
}

/**
 * Resets the cached actor instance.
 * @deprecated Use resetAnonymousActor from '../ic/actor' instead.
 */
export function resetBackendActor(): void {
  // No-op for compatibility - caching is now handled by the shared factory
  console.warn('resetBackendActor is deprecated. Actor caching is now handled by the shared factory.');
}

/**
 * Performs a health check by calling the backend health method.
 * @deprecated Use checkHealth from '../ic/actor' instead.
 */
export async function checkBackendHealth(): Promise<boolean> {
  const result = await checkHealth();
  return result.online;
}
