import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CURRENCIES } from '@/constants/currencies';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { Button } from '@/components/ui/Button';

export default function Step1Currency() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [selected, setSelected] = useState(store.get().currency || 'PHP');
  const [search, setSearch] = useState('');

  const filtered = search
    ? CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase())
      )
    : CURRENCIES;

  const handleContinue = () => {
    store.set({ currency: selected });
    router.push('/(onboarding)/step-2-balance');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-6">
        {/* Progress */}
        <View className="flex-row gap-2 mb-8">
          <View className="flex-1 h-1 rounded-full bg-budgy-lime" />
          <View className="flex-1 h-1 rounded-full bg-card-deep" />
        </View>

        {/* Header */}
        <Text className="text-text text-2xl font-bold mb-1">Choose your currency</Text>
        <Text className="text-secondary text-base mb-6">
          This will be used for all your transactions
        </Text>

        {/* Search */}
        <View className="flex-row items-center h-12 rounded-2xl bg-card border border-card-deep px-4 mb-4">
          <Ionicons name="search-outline" size={18} color="#9DA28F" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-text text-base"
            placeholder="Search currencies..."
            placeholderTextColor="#9DA28F"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#9DA28F" />
            </TouchableOpacity>
          )}
        </View>

        {/* Currency List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="gap-2 pb-4"
          renderItem={({ item }) => {
            const isSelected = item.code === selected;
            return (
              <TouchableOpacity
                onPress={() => setSelected(item.code)}
                activeOpacity={0.75}
                className={`flex-row items-center px-4 py-3.5 rounded-2xl border ${
                  isSelected
                    ? 'bg-budgy-lime/10 border-budgy-lime'
                    : 'bg-card border-card-deep'
                }`}
              >
                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      isSelected ? 'text-budgy-lime' : 'text-text'
                    }`}
                  >
                    {item.code}
                  </Text>
                  <Text className="text-secondary text-sm mt-0.5">{item.name}</Text>
                </View>
                <Text className={`text-base mr-3 ${isSelected ? 'text-budgy-lime' : 'text-tertiary'}`}>
                  {item.symbol}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color="#C8F560" />
                )}
              </TouchableOpacity>
            );
          }}
        />

        {/* Continue */}
        <View className="pt-4 pb-2">
          <Button title="Continue" onPress={handleContinue} />
        </View>
      </View>
    </SafeAreaView>
  );
}
