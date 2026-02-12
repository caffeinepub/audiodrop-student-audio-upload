import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Submission, UserProfile, MediaType, BlobMetadata } from '../backend';
import { ExternalBlob } from '../backend';
import { getBackendActor } from '../lib/icActor';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
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

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Submission Queries - Admin only, uses listSubmissions endpoint
export function useGetAllSubmissions() {
  const { actor, isFetching } = useActor();

  return useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: async () => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        // Call listSubmissions which checks admin permissions on backend
        const submissions = await actor.listSubmissions();
        return submissions;
      } catch (error: any) {
        // Handle backend authorization errors
        if (error?.message?.includes('Forbidden') || error?.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view submissions. Please ensure you are logged in as an administrator.');
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false, // Don't retry on auth errors
  });
}

export function useGetSubmission(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Submission | null>({
    queryKey: ['submission', id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      // Use getAllSubmissions and filter by id since there's no single submission getter
      const submissions = await actor.getAllSubmissions();
      return submissions.find(s => s.id === id) || null;
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      course: string;
      assessment: string;
      media: ExternalBlob;
      mediaType: MediaType;
      originalFileName: string;
      mimeType: string;
      sizeBytes: number;
    }) => {
      // Get actor directly from centralized module (waits for window load)
      const actor = await getBackendActor();
      
      if (!actor) {
        throw new Error('Backend not connected. Canister actor is unavailable.');
      }
      
      try {
        // Create metadata object for backend
        const metadata: BlobMetadata = {
          filename: params.originalFileName,
          mimeType: params.mimeType,
          sizeBytes: BigInt(params.sizeBytes),
        };

        // Call backend with all required parameters including metadata and mediaType
        return await actor.createSubmission(
          params.studentId,
          params.course,
          params.assessment,
          params.media,
          metadata,
          params.mediaType
        );
      } catch (error: any) {
        // Transform backend storage errors into user-friendly messages
        if (error?.message?.includes('storage') || error?.message?.includes('Upload failed')) {
          throw new Error('Upload failed. Please try again.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useDeleteSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminDeleteSubmissionById(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

// Check if current user is admin
export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error) {
        console.error('Failed to check admin status:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Backend health check hook - uses getVersion() for lightweight probe
export function useBackendHealth() {
  return useQuery<boolean>({
    queryKey: ['backendHealth'],
    queryFn: async () => {
      try {
        const actor = await getBackendActor();
        const version = await actor.getVersion();
        // Health check passes if we get a non-empty version string
        return typeof version === 'string' && version.length > 0;
      } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

// Placeholder hooks for settings and audit log (backend implementation required)
export function useGetAdminSettings() {
  return useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      // Placeholder: Return default settings until backend implements this
      return {
        captchaEnabled: false,
        rateLimit: 10,
        maxUploadSize: 25 * 1024 * 1024, // 25MB in bytes
        maxAudioSizeMB: 25,
        maxVideoSizeMB: 25,
        maxSubmissionsPerHour: 10,
      };
    },
  });
}

export function useUpdateAdminSettings() {
  return useMutation({
    mutationFn: async (settings: any) => {
      // Placeholder: Backend implementation required
      console.warn('Settings update not yet implemented in backend');
      throw new Error('Settings update requires backend implementation');
    },
  });
}

export function useGetAuditLog() {
  return useQuery({
    queryKey: ['auditLog'],
    queryFn: async () => {
      // Placeholder: Backend implementation required
      return [];
    },
  });
}
