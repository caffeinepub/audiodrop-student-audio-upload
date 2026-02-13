import { HttpAgent, Identity } from '@dfinity/agent';

/**
 * MAINNET-ONLY AGENT FACTORY
 * 
 * This module provides a shared HttpAgent instance for all IC calls.
 * Configuration is hardcoded for Internet Computer mainnet:
 * - Host: https://ic0.app (fixed, no alternatives)
 * - No fetchRootKey() calls (mainnet uses verified root keys)
 * - No localhost or local replica support
 */

const IC_HOST = 'https://ic0.app';

/**
 * Export the IC host for debugging and verification.
 */
export const getIcHost = (): string => IC_HOST;

/**
 * Create a new HttpAgent configured for mainnet.
 * NEVER calls fetchRootKey() - mainnet uses verified root keys from the replica.
 * 
 * @param identity - Optional identity for authenticated calls
 * @returns HttpAgent instance configured for ic0.app
 */
export function createAgent(identity?: Identity): HttpAgent {
  const agent = new HttpAgent({
    host: IC_HOST,
    ...(identity && { identity }),
  });

  // IMPORTANT: Do NOT call agent.fetchRootKey() here
  // fetchRootKey() is only for local development with dfx
  // Mainnet uses verified root keys from the replica

  return agent;
}

// Cached anonymous agent for reuse
let cachedAnonymousAgent: HttpAgent | null = null;

/**
 * Get or create a shared anonymous agent.
 * Uses caching to avoid recreating the agent on every call.
 */
export function getAnonymousAgent(): HttpAgent {
  if (!cachedAnonymousAgent) {
    cachedAnonymousAgent = createAgent();
  }
  return cachedAnonymousAgent;
}

/**
 * Reset the cached anonymous agent.
 * Call this when you need to force recreation (e.g., after network changes).
 */
export function resetAnonymousAgent(): void {
  cachedAnonymousAgent = null;
}
