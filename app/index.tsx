import { Redirect } from 'expo-router';
import { SplashScreenView } from '@/components/SplashScreenView';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) return <SplashScreenView />;
  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <Redirect href="/(app)" />;
  if (!profile.onboarding_done) return <Redirect href="/(onboarding)/step-1-currency" />;

  return <Redirect href="/(app)" />;
}
