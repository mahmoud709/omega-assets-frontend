'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './context/auth';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        </div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
