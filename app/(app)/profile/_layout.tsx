import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Pressable, Text } from 'react-native';

export default function ProfileLayout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const withHeaderBack = (title: string) => ({
    title,
    headerBackVisible: true,
    headerLeft: ({ canGoBack, tintColor }: { canGoBack: boolean; tintColor?: string }) =>
      !canGoBack ? (
        <Pressable
          onPress={() => router.replace('/(app)/profile')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2 }}
        >
          <Ionicons name="arrow-back" size={20} color={tintColor} />
          <Text style={{ color: tintColor, fontSize: 13, fontWeight: '700' }}>Back</Text>
        </Pressable>
      ) : undefined,
  });

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
      <Stack.Screen name="manage-wallets" options={{ title: 'Manage Wallets' }} />
      <Stack.Screen name="manage-categories" options={{ title: 'Manage Categories' }} />
      <Stack.Screen name="manage-debt" options={withHeaderBack('Manage Debt')} />
      <Stack.Screen name="manage-money-owed-to-you" options={withHeaderBack('Manage Money Owed To You')} />
      <Stack.Screen name="debt-detail/[id]" options={withHeaderBack('Debt Details')} />
    </Stack>
  );
}
