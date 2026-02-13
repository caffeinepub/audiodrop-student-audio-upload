import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Submission, UserProfile, ExistingSubmission, BlobMetadata, MediaType } from '../backend';
import { ExternalBlob } from '../backend';
import { getBackendCanisterId } from '../config/canisters';

/**
 * Hook to check backend health status.
 * Returns both online status and error message for diagnostics.
 */
export function useBackendHealth() {
  const { actor, isFetching } = useActor();

  return useQuery<{ online: boolean; error?: string }>({
    queryKey: ['backendHealth'],
    queryFn: async () => {
      const canisterId = getBackendCanisterId();
      
      if (!actor) {
        return { 
          online: false, 
          error: `Actor not initialized (Canister: ${canisterId})` 
        };
      }
      
      try {
        const result = await actor.health();
        if (result === 'ok') {
          return { online: true };
        }
        return { 
          online: false, 
          error: `Unexpected health response: ${result} (Canister: ${canisterId})` 
        };
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        return { 
          online: false, 
          error: `${errorMessage} (Canister: ${canisterId})` 
        };
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  });
}

/**
 * Hook to check if the current user is an admin.
 */
export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error: any) {
        // Handle canister_not_found and other errors gracefully
        if (error?.message?.includes('canister_not_found')) {
          const canisterId = getBackendCanisterId();
          console.error(`[useIsAdmin] Canister not found: ${canisterId}`, error);
        }
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Hook to get all submissions (admin only).
 */
export function useGetAllSubmissions() {
  const { actor, isFetching } = useActor();

  return useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllSubmissions();
      } catch (error: any) {
        // Handle canister_not_found and other errors
        if (error?.message?.includes('canister_not_found')) {
          const canisterId = getBackendCanisterId();
          console.error(`[useGetAllSubmissions] Canister not found: ${canisterId}`, error);
          throw new Error(`Backend canister not found (${canisterId}). Please check configuration.`);
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Hook to get a single submission by ID (admin only).
 */
export function useGetSubmission(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Submission | null>({
    queryKey: ['submission', id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      try {
        const submissions = await actor.getAllSubmissions();
        return submissions.find(s => s.id === id) || null;
      } catch (error: any) {
        if (error?.message?.includes('canister_not_found')) {
          const canisterId = getBackendCanisterId();
          console.error(`[useGetSubmission] Canister not found: ${canisterId}`, error);
          throw new Error(`Backend canister not found (${canisterId}). Please check configuration.`);
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

/**
 * Hook to get submissions for a specific student (admin only).
 */
export function useGetSubmissionsByStudent(studentId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ExistingSubmission[]>({
    queryKey: ['submissions', studentId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.adminSubmissions(studentId);
      } catch (error: any) {
        if (error?.message?.includes('canister_not_found')) {
          const canisterId = getBackendCanisterId();
          console.error(`[useGetSubmissionsByStudent] Canister not found: ${canisterId}`, error);
          throw new Error(`Backend canister not found (${canisterId}). Please check configuration.`);
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

/**
 * Hook to create a new submission (authenticated users).
 */
export function useCreateSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      course,
      assessment,
      media,
      metadata,
      mediaType,
    }: {
      studentId: string;
      course: string;
      assessment: string;
      media: ExternalBlob;
      metadata: BlobMetadata;
      mediaType: MediaType;
    }) => {
      if (!actor) {
        throw new Error('Actor not initialized');
      }
      
      try {
        await actor.createSubmission(studentId, course, assessment, media, metadata, mediaType);
      } catch (error: any) {
        if (error?.message?.includes('canister_not_found')) {
          const canisterId = getBackendCanisterId();
          console.error(`[useCreateSubmission] Canister not found: ${canisterId}`, error);
          throw new Error(`Backend canister not found (${canisterId}). Please verify the canister ID in config/canisters.ts`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

/**
 * Hook to delete a submission by ID (admin only).
 */
export function useDeleteSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) {
        throw new Error('Actor not initialized');
      }
      
      try {
        await actor.adminDeleteSubmissionById(id);
      } catch (error: any) {
        if (error?.message?.includes('canister_not_found')) {
          const canisterId = getBackendCanisterId();
          console.error(`[useDeleteSubmission] Canister not found: ${canisterId}`, error);
          throw new Error(`Backend canister not found (${canisterId}). Please check configuration.`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

/**
 * Hook to get the current user's profile.
 */
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error: any) {
        if (error?.message?.includes('canister_not_found')) {
          const canisterId = getBackendCanisterId();
          console.error(`[useGetCallerUserProfile] Canister not found: ${canisterId}`, error);
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

/**
 * Hook to save the current user's profile.
 */
export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) {
        throw new Error('Actor not initialized');
      }
      
      try {
        await actor.saveCallerUserProfile(profile);
      } catch (error: any) {
        if (error?.message?.includes('canister_not_found')) {
          const canisterId = getBackendCanisterId();
          console.error(`[useSaveCallerUserProfile] Canister not found: ${canisterId}`, error);
          throw new Error(`Backend canister not found (${canisterId}). Please check configuration.`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Placeholder types for admin settings (backend not implemented)
interface AdminSettings {
  captchaEnabled: boolean;
  maxAudioSizeMB: number;
  maxVideoSizeMB: number;
  maxSubmissionsPerHour: number;
}

/**
 * Hook to get admin settings.
 * Note: Backend implementation not available, returns mock data.
 */
export function useGetAdminSettings() {
  return useQuery<AdminSettings>({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      // Mock data since backend doesn't implement this yet
      return {
        captchaEnabled: false,
        maxAudioSizeMB: 25,
        maxVideoSizeMB: 25,
        maxSubmissionsPerHour: 10,
      };
    },
  });
}

/**
 * Hook to update admin settings.
 * Note: Backend implementation not available, this is a no-op.
 */
export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<AdminSettings>) => {
      // No-op since backend doesn't implement this yet
      console.warn('Admin settings update not implemented in backend');
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
  });
}

// Placeholder type for audit log entries
interface AuditLogEntry {
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

/**
 * Hook to get audit log.
 * Note: Backend implementation not available, returns empty array.
 */
export function useGetAuditLog() {
  return useQuery<AuditLogEntry[]>({
    queryKey: ['auditLog'],
    queryFn: async () => {
      // Return empty array since backend doesn't implement this yet
      return [];
    },
  });
}
