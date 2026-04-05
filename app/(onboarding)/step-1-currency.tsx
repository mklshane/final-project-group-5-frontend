import React, { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';

const CURRENCIES = [
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

export default function Step1Currency() {
  const router = useRouter();
  const [selected, setSelected] = useState(CURRENCIES[0]);
  const store = useOnboardingStore();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.set({ currency: selected.code });
    router.push('/(onboarding)/step-2-balance');
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-bg relative">
      <View className="px-6 pt-6 mb-4">
        {/* Sleek SaaS Progress Bar */}
        <View className="h-1.5 w-full bg-card rounded-full mb-8 overflow-hidden flex-row">
          <View className="h-full w-1/2 bg-budgy-lime rounded-full" />
        </View>

        <Text className="text-text text-3xl font-extrabold tracking-tight mb-2">
          Choose your currency
        </Text>
        <Text className="text-secondary text-base font-medium leading-relaxed">
          Select the main currency for tracking your finances. You can't change this later.
        </Text>
      </View>

      {/* Direct List Selection instead of a Modal */}
      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
      >
        {CURRENCIES.map((item) => {
          const isActive = item.code === selected.code;
          return (
            <Pressable
              key={item.code}
              onPress={() => {
                Haptics.selectionAsync();
                setSelected(item);
              }}
              className={`flex-row items-center p-4 rounded-[24px] border-[2px] transition-colors ${
                isActive 
                  ? 'bg-budgy-lime/10 border-budgy-lime' 
                  : 'bg-card border-transparent'
              }`}
            >
              <View className={`w-12 h-12 rounded-[16px] items-center justify-center mr-4 ${
                isActive ? 'bg-budgy-lime' : 'bg-bg'
              }`}>
                <Text className={`text-xl font-extrabold ${isActive ? 'text-[#1A1E14]' : 'text-text'}`}>
                  {item.symbol}
                </Text>
              </View>
              
              <View className="flex-1">
                <Text className="text-text text-lg font-bold">{item.code}</Text>
                <Text className="text-secondary text-sm font-medium">{item.name}</Text>
              </View>

              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                isActive ? 'border-budgy-lime bg-budgy-lime' : 'border-card-deep bg-card'
              }`}>
                {isActive && <Ionicons name="checkmark" size={14} color="#1A1E14" />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pinned Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-bg/95 pt-4">
        <Pressable 
          onPress={handleContinue}
          className="w-full h-[56px] bg-budgy-lime rounded-2xl items-center justify-center shadow-sm active:opacity-80"
        >
          <Text className="text-[#1A1E14] text-[16px] font-extrabold tracking-wide">
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}