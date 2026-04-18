import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = isDark ? '#EDF0E4' : '#1A1E14';

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        contentStyle: { backgroundColor: isDark ? '#111410' : '#F4F5E9' },
        headerStyle: { backgroundColor: isDark ? '#111410' : '#F4F5E9' },
        headerTintColor: tintColor,
        headerTitleStyle: { fontWeight: '800' },
        headerBackButtonDisplayMode: 'minimal',
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={{ paddingRight: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color={tintColor} />
            </Pressable>
          ) : null,
      })}
    >
      <Stack.Screen name="manage-wallets" options={{ title: 'Wallets' }} />
      <Stack.Screen name="manage-categories" options={{ title: 'Categories' }} />
      <Stack.Screen name="manage-goals" options={{ title: 'Goals' }} />
      <Stack.Screen name="manage-debt" options={{ title: 'Debt' }} />
      <Stack.Screen name="manage-money-owed-to-you" options={{ title: 'Money Owed To You' }} />
      <Stack.Screen name="debt-detail/[id]" options={{ title: 'Debt Details' }} />
      <Stack.Screen name="goal-detail/[id]" options={{ title: 'Goal Details' }} />
      <Stack.Screen name="profile-details" options={{ title: 'Account' }} />
    </Stack>
  );
}
