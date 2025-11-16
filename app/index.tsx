import { Redirect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

export default function Index() {
  const { isAuthenticated, loading } = useUser();

  if (loading) return null;

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />;
}
