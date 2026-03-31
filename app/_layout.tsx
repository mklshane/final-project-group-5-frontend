import 'react-native-url-polyfill/auto';
import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SplashScreenView } from '@/components/SplashScreenView';

function RootLayoutNav() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inApp = segments[0] === '(app)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (profile) {
      if (!profile.onboarding_done && !inOnboarding) {
        router.replace('/(onboarding)/step-1-currency');
      } else if (profile.onboarding_done && !inApp) {
        router.replace('/(app)/home');
      }
    }
  }, [session, profile, loading]);

  if (loading) return <SplashScreenView />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
