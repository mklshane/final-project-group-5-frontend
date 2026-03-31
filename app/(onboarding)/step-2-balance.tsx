import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { CURRENCIES } from '@/constants/currencies';
import { Button } from '@/components/ui/Button';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function Step2Balance() {
  const router = useRouter();
  const { session, profile, refreshProfile } = useAuth();
  const store = useOnboardingStore();

  const { currency } = store.get();
  const currencyInfo = CURRENCIES.find((c) => c.code === currency);
  const symbol = currencyInfo?.symbol ?? currency;

  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    const amount = parseFloat(balance.replace(/,/g, ''));
    if (isNaN(amount)) {
      setError('Please enter a valid balance');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/complete-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({ full_name: profile?.full_name ?? '', currency, balance: amount }),
      });

      if (res.ok) {
        store.reset();
        await refreshProfile();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setBalance(cleaned);
    setError('');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-1 px-6 pt-6">
          
          {/* Progress Indicator */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="w-10 h-10 rounded-full bg-card border border-card-deep items-center justify-center mr-4 shadow-sm">
              <Ionicons name="arrow-back" size={20} color="#9DA28F" />
            </TouchableOpacity>
            <View className="flex-1 flex-row gap-2">
              <View className="h-1.5 flex-1 rounded-full bg-budgy-lime shadow-sm" />
              <View className="h-1.5 flex-1 rounded-full bg-budgy-lime shadow-sm" />
            </View>
            <Text className="text-secondary text-xs font-extrabold ml-4 tracking-widest uppercase">Step 2 of 2</Text>
          </View>

          <Text className="text-text text-4xl font-extrabold tracking-tight mb-3">Current Balance</Text>
          <Text className="text-secondary text-base font-medium mb-12 leading-relaxed">
            Enter the total amount across all your accounts to start fresh.
          </Text>

          {/* Oversized Balance Input */}
          <View className="items-center justify-center mb-10 flex-1">
            <View className="flex-row items-center justify-center bg-card px-8 py-10 rounded-[32px] w-full border border-card-deep shadow-sm">
              <Text className="text-secondary text-4xl font-semibold mr-2">{symbol}</Text>
              <TextInput
                className="text-text font-extrabold min-w-[100px] text-center"
                value={balance}
                onChangeText={handleBalanceChange}
                placeholder="0.00"
                placeholderTextColor="#9DA28F"
                keyboardType="decimal-pad"
                autoFocus
                style={{ fontSize: balance.length > 7 ? 40 : 56, letterSpacing: -1 }}
              />
            </View>
            {error ? (
              <View className="bg-budgy-red/10 border border-budgy-red/30 rounded-xl px-4 py-2 mt-6 flex-row items-center gap-2">
                 <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                 <Text className="text-budgy-red text-sm font-medium">{error}</Text>
              </View>
            ) : (
              <View className="mt-6 flex-row items-center gap-2 bg-card px-4 py-2 rounded-full border border-card-deep">
                <Ionicons name="information-circle" size={16} color="#9DA28F" />
                <Text className="text-secondary text-xs font-bold uppercase tracking-widest">{currency} · {currencyInfo?.name}</Text>
              </View>
            )}
          </View>

          <View className="pb-2">
            <Button title="Complete Setup" onPress={handleComplete} loading={loading} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}