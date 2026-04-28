import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import '../global.css';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FinanceDataProvider, useFinanceData } from '@/context/FinanceDataContext';
import { AppPreferencesProvider, useAppPreferences } from '@/context/AppPreferencesContext';
import { ToastProvider, useToast } from '@/context/ToastContext';
import { SplashScreenView } from '@/components/SplashScreenView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DevPanel } from '@/components/DevPanel';
import { devStore } from '@/lib/devStore';

function ThemePreferenceBridge({ children }: { children: React.ReactNode }) {
  const { themeMode } = useAppPreferences();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(themeMode);
  }, [themeMode, setColorScheme]);

  return <>{children}</>;
}

function SyncErrorBridge() {
  const { error } = useFinanceData();
  const toast = useToast();
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== shownRef.current) {
      shownRef.current = error;
      toast.show('Sync issue — changes may not be saved', 'error');
    } else if (!error) {
      shownRef.current = null;
    }
  }, [error]);

  return null;
}

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
        router.replace('/(app)/(tabs)');
      }
    } else {
      // Session exists but profile is still loading — wait before navigating.
      refreshProfile();
    }
  }, [session, profile, loading]);

  if (loading) return <SplashScreenView />;

  return (
    <View style={{ flex: 1 }}>
      <SyncErrorBridge />
      <Stack screenOptions={{ headerShown: false }} />
      {/* __DEV__ && <DevPanel /> */}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FinanceDataProvider>
          <AppPreferencesProvider>
            <ThemePreferenceBridge>
              <ToastProvider>
                <ErrorBoundary>
                  <RootLayoutNav />
                </ErrorBoundary>
              </ToastProvider>
            </ThemePreferenceBridge>
          </AppPreferencesProvider>
        </FinanceDataProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
