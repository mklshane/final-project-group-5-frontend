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
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="manage-wallets" options={{ title: 'Wallets' }} />
      <Stack.Screen name="manage-categories" options={{ title: 'Categories' }} />
      <Stack.Screen name="manage-goals" options={{ title: 'Goals' }} />
      <Stack.Screen name="manage-debt" options={{ title: 'Debt' }} />
      <Stack.Screen name="manage-money-owed-to-you" options={{ title: 'Money Owed To You' }} />
      <Stack.Screen name="debt-detail/[id]" options={{ title: 'Debt Details' }} />
      <Stack.Screen name="profile-details" options={{ title: 'Account' }} />
    </Stack>
  );
}
