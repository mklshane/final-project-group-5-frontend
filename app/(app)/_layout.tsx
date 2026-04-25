import { Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';

export default function AppLayout() {
  const theme = useTheme();
  useNotificationScheduler();

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        contentStyle: { backgroundColor: theme.bg },
        headerStyle: { backgroundColor: theme.surface },
        headerShadowVisible: false,
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          letterSpacing: 0.2,
          color: theme.text,
        },
        headerBackButtonDisplayMode: 'minimal',
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={{ paddingRight: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color={theme.text} />
            </Pressable>
          ) : null,
        headerTitleAlign: 'center',
      })}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}
