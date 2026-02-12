import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../backend.did';
import type { backendInterface } from '../backend';

// Get canister ID from environment variables
const getCanisterId = (): string => {
  // Vite exposes env vars via import.meta.env
  const canisterId = 
    import.meta.env.VITE_CANISTER_ID_BACKEND ||
    import.meta.env.CANISTER_ID_BACKEND ||
    import.meta.env.VITE_BACKEND_CANISTER_ID;
  
  if (!canisterId) {
    throw new Error('Backend canister ID not found. Please ensure VITE_CANISTER_ID_BACKEND or CANISTER_ID_BACKEND is set in your environment.');
  }
  
  return canisterId;
};

// Get host URL based on environment
const getHost = (): string => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  return isDevelopment ? 'http://localhost:4943' : 'https://icp0.io';
};

// Cached actor instance
let cachedActor: backendInterface | null = null;
let cachedAgent: HttpAgent | null = null;
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

/**
 * Wait for window to load before initializing actor.
 * This ensures all resources are available in deployed environments.
 */
async function waitForWindowLoad(): Promise<void> {
  if (typeof window === 'undefined') {
    return; // SSR environment, skip
  }

  if (document.readyState === 'complete') {
    return; // Already loaded
  }

  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true });
  });
}

/**
 * Initialize the actor after window load.
 * This is called automatically by getBackendActor.
 */
async function initializeActor(): Promise<void> {
  if (isInitialized) {
    return;
  }

  // Wait for window load event
  await waitForWindowLoad();

  isInitialized = true;
}

/**
 * Creates and returns a backend actor instance.
 * Uses lazy initialization and caching to avoid recreating the actor on every call.
 * Waits for window load before creating actor in deployed environments.
 * 
 * @param identity - Optional identity for authenticated calls
 * @returns Promise resolving to the backend actor
 */
export async function getBackendActor(identity?: any): Promise<backendInterface> {
  // Ensure initialization has completed
  if (!initializationPromise) {
    initializationPromise = initializeActor();
  }
  await initializationPromise;

  // Return cached actor if available and identity hasn't changed
  if (cachedActor && !identity) {
    return cachedActor;
  }

  try {
    const canisterId = getCanisterId();
    const host = getHost();
    
    // Create HTTP agent
    const agent = new HttpAgent({
      host,
      identity,
    });

    // Fetch root key only in development (local replica)
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDevelopment) {
      try {
        await agent.fetchRootKey();
      } catch (err) {
        console.warn('Unable to fetch root key. Ensure local replica is running:', err);
      }
    }

    // Create actor using the IDL factory and canister ID
    const actor = Actor.createActor<backendInterface>(idlFactory, {
      agent,
      canisterId,
    });

    // Cache the actor and agent for reuse
    if (!identity) {
      cachedActor = actor;
      cachedAgent = agent;
    }

    return actor;
  } catch (error) {
    console.error('Failed to create backend actor:', error);
    throw new Error('Failed to initialize backend connection');
  }
}

/**
 * Resets the cached actor instance.
 * Call this when you need to force recreation of the actor (e.g., after logout).
 */
export function resetBackendActor(): void {
  cachedActor = null;
  cachedAgent = null;
}

/**
 * Performs a health check by calling the backend getVersion method.
 * Returns true if the backend is reachable, false otherwise.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const actor = await getBackendActor();
    const version = await actor.getVersion();
    return typeof version === 'string' && version.length > 0;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}
