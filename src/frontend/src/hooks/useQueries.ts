import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Submission, UserProfile, MediaType } from '../backend';
import { ExternalBlob } from '../backend';

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
      id: bigint;
      fullName: string;
      studentId: string;
      course: string;
      assessment: string;
      email: string;
      media: ExternalBlob;
      mediaType: MediaType;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend accepts media and mediaType
      return actor.createSubmission(
        params.id,
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
      return actor.deleteSubmission(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

// Admin Role Check
export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin Settings (placeholder for backend implementation)
export function useGetAdminSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<{ captchaEnabled: boolean }>({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      // Placeholder: Backend doesn't support settings yet
      // Default to CAPTCHA disabled
      return { captchaEnabled: false };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateAdminSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: { captchaEnabled: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      // Placeholder: Backend doesn't support settings yet
      throw new Error('Settings update requires backend implementation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
  });
}

// Audit Log (placeholder for backend implementation)
export function useGetAuditLog(filters?: { actionType?: string; startDate?: Date; endDate?: Date }) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['auditLog', filters],
    queryFn: async () => {
      if (!actor) return [];
      // Placeholder: Backend doesn't support audit log yet
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

// CSV Export (placeholder for backend implementation)
export function useExportCSV() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (filters: { search?: string; startDate?: Date; endDate?: Date }) => {
      if (!actor) throw new Error('Actor not available');
      // Placeholder: Backend doesn't support CSV export yet
      throw new Error('CSV export requires backend implementation');
    },
  });
}

// ZIP Export (placeholder for backend implementation)
export function useExportZIP() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (filters: { search?: string; startDate?: Date; endDate?: Date }) => {
      if (!actor) throw new Error('Actor not available');
      // Placeholder: Backend doesn't support ZIP export yet
      throw new Error('ZIP export requires backend implementation');
    },
  });
}
