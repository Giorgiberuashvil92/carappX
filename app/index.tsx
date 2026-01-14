import { Redirect, useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useEffect } from 'react';

export default function Index() {
  const { isAuthenticated, loading, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return null;

  if (user && user.role === 'customer') {
    return <Redirect href="/login" />;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />;
}
