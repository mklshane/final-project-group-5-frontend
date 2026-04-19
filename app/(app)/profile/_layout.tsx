import { Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function ProfileLayout() {
  const theme = useTheme();
  const tintColor = theme.text;
  const headerBg = theme.surface;

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        contentStyle: { backgroundColor: theme.bg },
        headerStyle: { backgroundColor: headerBg },
        headerShadowVisible: false,
        headerTintColor: tintColor,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          letterSpacing: 0.2,
          color: tintColor,
        },
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
        headerTitleAlign: 'center',
      })}
    >
      <Stack.Screen name="manage-wallets" options={{ title: 'Wallets' }} />
      <Stack.Screen name="manage-categories" options={{ title: 'Categories' }} />
      <Stack.Screen name="manage-budgets" options={{ title: 'Category Budgeting' }} />
      <Stack.Screen name="manage-goals" options={{ title: 'Goals' }} />
      <Stack.Screen name="manage-debt" options={{ title: 'Debt' }} />
      <Stack.Screen name="manage-money-owed-to-you" options={{ title: 'Money Owed To You' }} />
      <Stack.Screen name="debt-detail/[id]" options={{ title: 'Debt Details' }} />
      <Stack.Screen name="goal-detail/[id]" options={{ title: 'Goal Details' }} />
      <Stack.Screen name="profile-details" options={{ title: 'Account' }} />
    </Stack>
  );
}
