import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { APIError, rpgWorldApi } from '@client';

import { Profile } from '@backend/contexts/users/domain/Profile';

export function useProfile() {
  const queryClient = useQueryClient();

  const query = useQuery<Profile, APIError>({
    queryKey: ['profile'],
    queryFn: () => rpgWorldApi.get<Profile>('/api/profile'),
    retry: (failureCount, error) => {
      if (error instanceof APIError && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (anonymous state is stable)
  });

  const mutation = useMutation<void, Error, Partial<Profile>>({
    mutationFn: (data) => rpgWorldApi.patch<void, Partial<Profile>>('/api/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const avatarMutation = useMutation<{ url: string }, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Upload failed');
      }

      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    uploadAvatar: avatarMutation.mutateAsync,
    isUploadingAvatar: avatarMutation.isPending,
  };
}
