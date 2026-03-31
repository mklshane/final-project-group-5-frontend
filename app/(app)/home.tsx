import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
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

  const RECENT = [
    { id: 1, name: 'Grab ride', category: 'Transport', amount: '-185.00', icon: 'car', color: '#FFAD5C', bg: 'bg-budgy-orange/10' },
    { id: 2, name: 'Jollibee', category: 'Food', amount: '-249.00', icon: 'restaurant', color: '#FF6B6B', bg: 'bg-budgy-red/10' },
    { id: 3, name: 'Freelance payment', category: 'Income', amount: '+5,000.00', icon: 'cash', color: '#3DD97B', bg: 'bg-budgy-green/10' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="pb-24" showsVerticalScrollIndicator={false}>
        
        {/* Header Bar */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-dark items-center justify-center shadow-sm">
              <Text className="text-budgy-lime text-lg font-extrabold">{firstName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text className="text-secondary text-[11px] font-bold uppercase tracking-widest">Good morning</Text>
              <Text className="text-text text-xl font-extrabold tracking-tight">{firstName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={signOut} activeOpacity={0.7} className="w-10 h-10 rounded-full bg-card border border-card-deep items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="#9DA28F" />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View className="mx-6 mt-6 bg-dark border border-dark-2 rounded-[32px] p-6 shadow-xl overflow-hidden">
          <View className="absolute -top-12 -right-8 w-40 h-40 bg-budgy-lime/10 rounded-full" />
          <View className="absolute -bottom-8 -left-6 w-24 h-24 bg-budgy-blue/10 rounded-full" />
          
          <View className="relative z-10">
            <Text className="text-bg/60 text-xs font-bold uppercase tracking-widest mb-1">Total Balance</Text>
            <View className="flex-row items-end gap-1 mt-1">
              <Text className="text-bg/70 text-2xl font-bold mb-1">{symbol}</Text>
              <Text className="text-budgy-lime text-[42px] leading-[48px] font-extrabold tracking-tighter">{formattedBalance}</Text>
            </View>
            <View className="flex-row items-center gap-2 mt-4">
               <View className="w-2 h-2 rounded-full bg-budgy-lime shadow-[0_0_8px_rgba(200,245,96,0.8)]" />
               <Text className="text-bg/60 text-xs font-bold tracking-wide uppercase">Active tracking in {profile?.currency ?? 'USD'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row px-6 mt-6 gap-4">
          <TouchableOpacity activeOpacity={0.7} className="flex-1 bg-card rounded-3xl p-5 items-center justify-center border border-card-deep shadow-sm">
            <View className="w-12 h-12 rounded-2xl bg-budgy-lime/10 items-center justify-center mb-3">
              <Ionicons name="add" size={24} color="#9BC23A" />
            </View>
            <Text className="text-text text-sm font-bold">Add Entry</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} className="flex-1 bg-card rounded-3xl p-5 items-center justify-center border border-card-deep shadow-sm">
            <View className="w-12 h-12 rounded-2xl bg-budgy-blue/10 items-center justify-center mb-3">
              <Ionicons name="scan" size={22} color="#6BA3FF" />
            </View>
            <Text className="text-text text-sm font-bold">Quick Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View className="mt-8 px-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-text text-xl font-extrabold tracking-tight">Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-secondary text-sm font-bold">See All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-card rounded-[24px] border border-card-deep overflow-hidden shadow-sm">
            {RECENT.map((tx, idx) => (
              <TouchableOpacity key={tx.id} activeOpacity={0.7} className={`flex-row items-center p-4 ${idx !== RECENT.length - 1 ? 'border-b border-card-deep/50' : ''}`}>
                <View className={`w-12 h-12 rounded-[14px] items-center justify-center mr-4 ${tx.bg}`}>
                  <Ionicons name={tx.icon as any} size={20} color={tx.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-text text-base font-bold">{tx.name}</Text>
                  <Text className="text-secondary text-[13px] font-medium mt-0.5">{tx.category}</Text>
                </View>
                <Text className={`text-base font-bold tracking-tight ${tx.amount.startsWith('+') ? 'text-budgy-green' : 'text-text'}`}>
                  {tx.amount.startsWith('+') ? '+' : ''}{symbol}{tx.amount.replace('+', '').replace('-', '')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}