'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth';

export const useProtectedRoute = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    router.push('/auth/login');
  }

  return { user, isLoading };
};

export const useRequireRole = (allowedRoles: string[]) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (!isLoading && (!user || !allowedRoles.includes(user.role))) {
    router.push('/dashboard');
  }

  return { user, isLoading };
};
