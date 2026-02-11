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

// Submission Queries
export function useGetAllSubmissions() {
  const { actor, isFetching } = useActor();

  return useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSubmission(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Submission | null>({
    queryKey: ['submission', id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getSubmission(id);
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
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSubmission(
        params.studentId,
        params.course,
        params.assessment,
        params.media,
        params.mediaType
      );
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
      return actor.deleteSubmissionById(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

// Admin Session Management
export function useAdminSession() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['adminSession'],
    queryFn: () => adminApi.checkAdminSession(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      adminApi.adminLogin(credentials),
    onSuccess: () => {
      queryClient.setQueryData(['adminSession'], true);
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return adminApi.adminLogin(credentials);
    },
    onSuccess: () => {
      queryClient.setQueryData(['adminSession'], true);
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

// Admin Check Hook
export function useIsAdmin() {
  return useQuery({
    queryKey: ['adminSession'],
    queryFn: () => adminApi.checkAdminSession(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Admin Settings (placeholder)
export function useGetAdminSettings() {
  return useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      // Placeholder: return default settings
      return {
        captchaEnabled: false,
        maxFileSize: 25 * 1024 * 1024,
        rateLimit: 10,
        maxAudioSizeMB: 25,
        maxVideoSizeMB: 25,
        maxSubmissionsPerHour: 10,
      };
    },
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: {
      captchaEnabled: boolean;
      maxAudioSizeMB: number;
      maxVideoSizeMB: number;
    }) => {
      // Placeholder: simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
  });
}

// Audit Log (placeholder)
export function useGetAuditLog(filters?: {
  action?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['auditLog', filters],
    queryFn: async () => {
      // Placeholder: return empty audit log
      return [];
    },
  });
}
