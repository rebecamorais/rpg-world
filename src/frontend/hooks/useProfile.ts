import { Profile } from '@backend/contexts/users/domain/Profile';
import { rpgWorldApi } from '@client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useProfile() {
  const queryClient = useQueryClient();

  const query = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => rpgWorldApi.get<Profile>('/api/profile'),
  });

  const mutation = useMutation<void, Error, Partial<Profile>>({
    mutationFn: (data) =>
      rpgWorldApi.patch<void, Partial<Profile>>('/api/profile', data),
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
  };
}
