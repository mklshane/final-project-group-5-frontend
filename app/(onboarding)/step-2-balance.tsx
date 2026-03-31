import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid balance');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.access_token}`,
        },
        body: JSON.stringify({
          full_name: profile?.full_name ?? '',
          currency,
          balance: amount,
        }),
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
    // Allow only digits and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setBalance(cleaned);
    setError('');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-6">
          {/* Progress */}
          <View className="flex-row gap-2 mb-8">
            <View className="flex-1 h-1 rounded-full bg-budgy-lime" />
            <View className="flex-1 h-1 rounded-full bg-budgy-lime" />
          </View>

          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 mb-6 self-start"
          >
            <Ionicons name="chevron-back" size={20} color="#9DA28F" />
            <Text className="text-secondary text-sm">Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <Text className="text-text text-2xl font-bold mb-1">What's your current balance?</Text>
          <Text className="text-secondary text-base mb-10">
            Enter the total amount across all your accounts
          </Text>

          {/* Balance Input */}
          <View className="items-center mb-6">
            <View className="flex-row items-center justify-center">
              <Text className="text-tertiary text-4xl font-light mr-2">{symbol}</Text>
              <TextInput
                className="text-text text-5xl font-bold min-w-[80px] text-center"
                value={balance}
                onChangeText={handleBalanceChange}
                placeholder="0"
                placeholderTextColor="#9DA28F"
                keyboardType="decimal-pad"
                autoFocus
                style={{ fontSize: balance.length > 6 ? 36 : 52 }}
              />
            </View>
            <Text className="text-secondary text-sm mt-3">{currency} · {currencyInfo?.name}</Text>
          </View>

          {error ? (
            <View className="bg-budgy-red/10 border border-budgy-red rounded-2xl px-4 py-3 mb-4">
              <Text className="text-budgy-red text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Quick amount chips */}
          <View className="flex-row flex-wrap gap-2 justify-center mb-8">
            {['1000', '5000', '10000', '50000'].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setBalance(amt)}
                activeOpacity={0.75}
                className="px-4 py-2 rounded-full bg-card border border-card-deep"
              >
                <Text className="text-secondary text-sm">
                  {symbol}{parseInt(amt).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-1" />

          <View className="pb-2">
            <Button
              title="Complete Setup"
              onPress={handleComplete}
              loading={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
