import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { CURRENCIES } from '@/constants/currencies';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';

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
  const inputRef = useRef<TextInput>(null);

  // Auto-focus for a seamless transition between steps
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleComplete = async () => {
    const amount = parseFloat(balance.replace(/,/g, ''));
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid balance');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
   <SafeAreaView style={{ flex: 1 }} className="bg-bg relative">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-6">
          
          {/* Completed Progress Bar */}
          <View className="h-1.5 w-full bg-card rounded-full mb-6 overflow-hidden flex-row">
            <View className="h-full w-full bg-budgy-lime rounded-full" />
          </View>

          {/* Clean Header with embedded back button */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="w-10 h-10 bg-card border border-card-deep rounded-full items-center justify-center mr-4"
            >
              <Ionicons name="chevron-back" size={20} color="#9DA28F" />
            </TouchableOpacity>
            <Text className="text-text text-xl font-extrabold flex-1">
              Initial Balance
            </Text>
          </View>

          {/* Centered Massive Input Area */}
          <View className="flex-1 justify-center items-center -mt-16">
            <Text className="text-secondary text-sm font-bold uppercase tracking-widest mb-4">
              {currencyInfo?.name} ({currency})
            </Text>

            <View className="flex-row items-center justify-center w-full">
              <Text className={`text-5xl font-bold mr-1 ${balance ? 'text-text' : 'text-card-deep'}`}>
                {symbol}
              </Text>
              <TextInput
                ref={inputRef}
                className="text-text font-extrabold text-center min-w-[80px]"
                style={{ fontSize: balance.length > 6 ? 48 : 64, height: 80 }}
                value={balance}
                onChangeText={handleBalanceChange}
                placeholder="0"
                placeholderTextColor="#2A3022"
                keyboardType="decimal-pad"
                selectionColor="#C8F560"
              />
            </View>

            {error ? (
              <View className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl mt-6">
                <Text className="text-red-400 text-sm font-medium">{error}</Text>
              </View>
            ) : null}

            {/* Quick Amount Chips styled as rounded tags */}
            <View className="flex-row flex-wrap gap-3 justify-center mt-10 w-full px-4">
              {['1000', '5000', '10000', '50000'].map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setBalance(amt);
                  }}
                  className="px-5 py-3 rounded-full bg-card border border-card-deep active:bg-budgy-lime/10 active:border-budgy-lime transition-all"
                >
                  <Text className="text-text font-bold">
                    +{symbol}{parseInt(amt).toLocaleString()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bottom Action */}
          <View className="pb-4 pt-2">
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