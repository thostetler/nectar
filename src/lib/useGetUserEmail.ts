import { useStore } from '@/store';

export const useGetUserEmail = () => {
  return useStore((state) => state.user?.username ?? 'anonymous@ads');
};
