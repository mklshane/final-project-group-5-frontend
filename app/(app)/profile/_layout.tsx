import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function ProfileLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: isDark ? '#111410' : '#F4F5E9' },
        headerStyle: { backgroundColor: isDark ? '#111410' : '#F4F5E9' },
        headerTintColor: isDark ? '#EDF0E4' : '#1A1E14',
        headerTitleStyle: { fontWeight: '800' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="manage-categories" options={{ title: 'Manage Categories' }} />
    </Stack>
  );
}
