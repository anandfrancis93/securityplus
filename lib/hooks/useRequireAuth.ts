import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to redirect unauthenticated users to home page
 * Use this hook in any page that requires authentication
 */
export function useRequireAuth(
  user: any,
  authLoading: boolean,
  redirectTo: string = '/'
) {
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);
}
