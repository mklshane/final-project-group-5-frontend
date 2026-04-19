// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#C8F560' : '#1A2B23',
        tabBarInactiveTintColor: isDark ? '#99A99C' : '#8E9A90',
        tabBarStyle: {
          backgroundColor: isDark ? '#16221B' : '#FFFFFF',
          borderTopColor: isDark ? '#2F4035' : '#DCE2D5',
          borderTopWidth: 1,
          elevation: isDark ? 0 : 8,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -2 },
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "pie-chart" : "pie-chart-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          popToTopOnBlur: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}