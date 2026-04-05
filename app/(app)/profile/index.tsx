import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearanceModeSelector } from '@/components/Base/AppearanceModeSelector';
import { WalletPreviewSection } from '@/components/Profile/WalletPreviewSection';
import { useAuth } from '@/context/AuthContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const finance = useFinanceSelectors();

  const isDark = colorScheme === 'dark';

  const palette = {
    screenBg: isDark ? '#111410' : '#F4F5E9',
    title: isDark ? '#EDF0E4' : '#1A1E14',
    cardBg: isDark ? '#1A1E14' : '#FFFFFF',
    cardBorder: isDark ? '#2C3122' : '#E4E6D6',
    cardText: isDark ? '#EDF0E4' : '#1A1E14',
    cardSub: isDark ? '#8A8F7C' : '#6B7060',
    buttonBg: isDark ? '#1A1E14' : '#FFFFFF',
    buttonBorder: isDark ? '#2C3122' : '#E4E6D6',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.screenBg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 }}>
        <Text className="text-3xl font-extrabold tracking-tight mb-5" style={{ color: palette.title }}>
          Profile
        </Text>

        <AppearanceModeSelector />

        <Text className="text-secondary text-[11px] font-extrabold tracking-[2px] mt-5 mb-3">WALLETS</Text>

        <WalletPreviewSection wallets={finance.wallets} formatCurrency={finance.formatCurrency} />

        <TouchableOpacity
          onPress={() => router.push('/(app)/profile/manage-wallets')}
          activeOpacity={0.8}
          className="rounded-2xl border"
          style={{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder, paddingHorizontal: 14, paddingVertical: 14 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#222618' : '#EEF0E2', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="wallet-outline" size={18} color={isDark ? '#C8F560' : '#1A1E14'} />
              </View>
              <View className="flex-1">
                <Text style={{ color: palette.cardText, fontSize: 15, fontWeight: '800' }}>Manage Wallets</Text>
                <Text style={{ color: palette.cardSub, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                  Open wallet settings and add new wallet accounts.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.cardSub} />
          </View>
        </TouchableOpacity>

        <Text className="text-secondary text-[11px] font-extrabold tracking-[2px] mt-5 mb-3">CATEGORIES</Text>

        <TouchableOpacity
          onPress={() => router.push('/(app)/profile/manage-categories')}
          activeOpacity={0.8}
          className="rounded-2xl border"
          style={{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder, paddingHorizontal: 14, paddingVertical: 14 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#222618' : '#EEF0E2', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="grid-outline" size={18} color={isDark ? '#C8F560' : '#1A1E14'} />
              </View>
              <View className="flex-1">
                <Text style={{ color: palette.cardText, fontSize: 15, fontWeight: '800' }}>Manage Categories</Text>
                <Text style={{ color: palette.cardSub, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                  Customize expense and income categories.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.cardSub} />
          </View>
        </TouchableOpacity>

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
