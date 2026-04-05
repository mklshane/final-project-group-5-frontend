import 'react-native-url-polyfill/auto';
import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SplashScreenView } from '@/components/SplashScreenView';
import { DevPanel } from '@/components/DevPanel';
import { devStore } from '@/lib/devStore';

function RootLayoutNav() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (__DEV__ && devStore.isBypassing()) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inApp = segments[0] === '(app)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/welcome');
    } else if (profile) {
      if (!profile.onboarding_done && !inOnboarding) {
        router.replace('/(onboarding)/step-1-currency');
      } else if (profile.onboarding_done && !inApp) {
        router.replace('/(app)/home');
      }
    } else {
      // Session exists but profile fetch failed — retry
      refreshProfile();
    }
  }, [session, profile, loading]);

  if (loading) return <SplashScreenView />;

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {__DEV__ && <DevPanel />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
