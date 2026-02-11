import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Submission, UserProfile, MediaType } from '../backend';
import { ExternalBlob } from '../backend';
import * as adminApi from '../lib/adminApi';

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
        // Call listSubmissions which checks session.role === "admin" on backend
        const submissions = await actor.listSubmissions();
        return submissions;
      } catch (error: any) {
        // Handle backend authorization errors
        if (error?.message?.includes('Forbidden') || error?.message?.includes('Admin session required')) {
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
  const { actor } = useActor();
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
      if (!actor) throw new Error('Actor not available');
      
      try {
        // Note: Backend currently doesn't accept metadata parameters
        // This will be updated when backend is modified to accept originalFileName, mimeType, sizeBytes
        return await actor.createSubmission(
          params.studentId,
          params.course,
          params.assessment,
          params.media,
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

// Admin Session Management
export function useAdminSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  // Set actor instance for adminApi when actor is available
  if (actor) {
    adminApi.setActorInstance(actor);
  }

  const sessionQuery = useQuery({
    queryKey: ['adminSession'],
    queryFn: () => adminApi.checkAdminSession(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!actor,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      adminApi.adminLogin(credentials),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(['adminSession'], true);
        queryClient.invalidateQueries({ queryKey: ['submissions'] });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => adminApi.adminLogout(),
    onSuccess: () => {
      queryClient.setQueryData(['adminSession'], false);
      queryClient.clear();
    },
  });

  return {
    data: sessionQuery.data,
    isLoading: sessionQuery.isLoading,
    login: loginMutation,
    logout: logoutMutation,
  };
}

// Admin Login Hook
export function useAdminLogin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      if (!actor) throw new Error('Actor not available');
      
      const response = await actor.adminLogin(credentials);
      
      if (response.__kind__ === 'error') {
        throw new Error(response.error);
      }
      
      return response.ok;
    },
    onSuccess: () => {
      queryClient.setQueryData(['adminSession'], true);
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

// Admin Logout Hook
export function useAdminLogout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminLogout();
    },
    onSuccess: () => {
      queryClient.setQueryData(['adminSession'], false);
      queryClient.clear();
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
      const role = await actor.getSessionRole();
      return role === 'admin';
    },
    enabled: !!actor && !isFetching,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
