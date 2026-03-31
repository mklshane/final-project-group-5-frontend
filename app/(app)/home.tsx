import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { CURRENCIES } from '@/constants/currencies';

export default function HomeScreen() {
  const { profile, signOut } = useAuth();

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const currencyInfo = CURRENCIES.find((c) => c.code === profile?.currency);
  const symbol = currencyInfo?.symbol ?? profile?.currency ?? '$';
  const balance = profile?.balance ?? 0;

  const formattedBalance = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-6">
        {/* Top bar */}
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-secondary text-sm">Good morning,</Text>
            <Text className="text-text text-xl font-bold">{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            onPress={signOut}
            activeOpacity={0.75}
            className="flex-row items-center gap-2 bg-card border border-card-deep px-4 py-2.5 rounded-2xl"
          >
            <Ionicons name="log-out-outline" size={18} color="#9DA28F" />
            <Text className="text-secondary text-sm font-medium">Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View className="bg-dark rounded-3xl px-6 py-8 mb-6">
          <Text className="text-dark-2 text-sm font-medium mb-2">Total Balance</Text>
          <View className="flex-row items-end gap-2">
            <Text className="text-dark-3 text-xl font-medium">{symbol}</Text>
            <Text className="text-budgy-lime text-4xl font-bold">{formattedBalance}</Text>
          </View>
          <Text className="text-dark-3 text-xs mt-2">{profile?.currency ?? 'USD'}</Text>
        </View>

        {/* Coming soon placeholder */}
        <View className="flex-1 items-center justify-center">
          <View className="w-16 h-16 rounded-2xl bg-card border border-card-deep items-center justify-center mb-4">
            <Ionicons name="construct-outline" size={28} color="#9DA28F" />
          </View>
          <Text className="text-text text-lg font-semibold text-center">More features coming soon</Text>
          <Text className="text-secondary text-sm text-center mt-2 max-w-xs">
            Track expenses, set budgets, and manage your finances — all in one place.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
