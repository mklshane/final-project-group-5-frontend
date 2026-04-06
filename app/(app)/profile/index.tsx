import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearanceModeSelector } from '@/components/Base/AppearanceModeSelector';
import { WalletPreviewSection } from '@/components/Profile/WalletPreviewSection';
import { useAuth } from '@/context/AuthContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const theme = useTheme();
  const { isDark } = theme;
  const router = useRouter();
  const finance = useFinanceSelectors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 }}>
        <Text className="text-3xl font-extrabold tracking-tight mb-5" style={{ color: theme.text }}>
          Profile
        </Text>

        <Text className="text-secondary text-[11px] font-extrabold tracking-[2px] mt-5 mb-3">WALLETS</Text>

        <WalletPreviewSection wallets={finance.wallets} formatCurrency={finance.formatCurrency} />

        <TouchableOpacity
          onPress={() => router.push('/(app)/profile/manage-wallets')}
          activeOpacity={0.8}
          className="rounded-2xl border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border, paddingHorizontal: 14, paddingVertical: 14 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: isDark ? theme.surfaceDeep : 'rgba(155,194,58,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="wallet-outline" size={18} color={isDark ? theme.lime : theme.limeDark} />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>Manage Wallets</Text>
                <Text style={{ color: theme.secondary, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                  Open wallet settings and add new wallet accounts.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? theme.secondary : theme.text} />
          </View>
        </TouchableOpacity>

        <Text className="text-secondary text-[11px] font-extrabold tracking-[2px] mt-5 mb-3">CATEGORIES</Text>

        <TouchableOpacity
          onPress={() => router.push('/(app)/profile/manage-categories')}
          activeOpacity={0.8}
          className="rounded-2xl border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border, paddingHorizontal: 14, paddingVertical: 14 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: isDark ? theme.surfaceDeep : 'rgba(155,194,58,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="grid-outline" size={18} color={isDark ? theme.lime : theme.limeDark} />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>Manage Categories</Text>
                <Text style={{ color: theme.secondary, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                  Customize expense and income categories.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? theme.secondary : theme.text} />
          </View>
        </TouchableOpacity>

        <View className="mt-5">
          <AppearanceModeSelector />
        </View>

        <TouchableOpacity
          onPress={signOut}
          activeOpacity={0.7}
          className="flex-row items-center justify-center w-full rounded-2xl h-[56px] mt-6 border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
          <Text className="text-budgy-red text-base font-bold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
