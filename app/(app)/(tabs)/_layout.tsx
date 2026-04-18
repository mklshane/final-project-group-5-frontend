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
        tabBarActiveTintColor: isDark ? '#C8F560' : '#1A1E14',
        tabBarInactiveTintColor: isDark ? '#8A8F7C' : '#9DA28F',
        tabBarStyle: {
          backgroundColor: isDark ? '#1A1E14' : '#F4F5E9',
          borderTopColor: isDark ? '#2C3122' : '#E4E6D6',
          borderTopWidth: 1,
          elevation: 0,
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