import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { AppearanceModeSelector } from '@/components/Base/AppearanceModeSelector';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const palette = {
    screenBg: isDark ? '#111410' : '#F4F5E9',
    title: isDark ? '#EDF0E4' : '#1A1E14',
    buttonBg: isDark ? '#1A1E14' : '#FFFFFF',
    buttonBorder: isDark ? '#2C3122' : '#E4E6D6',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.screenBg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 }}>
        <Text className="text-3xl font-extrabold tracking-tight mb-5" style={{ color: palette.title }}>Profile</Text>

        <AppearanceModeSelector />

        <TouchableOpacity 
          onPress={signOut}
          activeOpacity={0.7}
          className="flex-row items-center justify-center w-full rounded-2xl h-[56px] mt-6 border"
          style={{ backgroundColor: palette.buttonBg, borderColor: palette.buttonBorder }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
          <Text className="text-budgy-red text-base font-bold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}