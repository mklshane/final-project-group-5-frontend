import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
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
    ? CURRENCIES.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    : CURRENCIES;

  const handleContinue = () => {
    store.set({ currency: selected });
    router.push('/(onboarding)/step-2-balance');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-6">
        
        {/* Progress Indicator */}
        <View className="flex-row items-center mb-8">
          <View className="flex-1 flex-row gap-2">
            <View className="h-1.5 flex-1 rounded-full bg-budgy-lime shadow-sm" />
            <View className="h-1.5 flex-1 rounded-full bg-card border border-card-deep" />
          </View>
          <Text className="text-secondary text-xs font-extrabold ml-4 tracking-widest uppercase">Step 1 of 2</Text>
        </View>

        <Text className="text-text text-4xl font-extrabold tracking-tight mb-3">Base Currency</Text>
        <Text className="text-secondary text-base font-medium mb-8 leading-relaxed">
          Select the main currency you want to use for tracking your finances.
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center h-14 rounded-2xl bg-card border-[1.5px] border-card-deep px-4 mb-6">
          <Ionicons name="search" size={20} color="#9DA28F" style={{ marginRight: 10 }} />
          <TextInput
            className="flex-1 text-text text-base font-medium h-full"
            placeholder="Search currencies..."
            placeholderTextColor="#9DA28F"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7} className="p-1">
              <Ionicons name="close-circle" size={20} color="#9DA28F" />
            </TouchableOpacity>
          )}
        </View>

        {/* Currency List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="gap-3 pb-6"
          renderItem={({ item }) => {
            const isSelected = item.code === selected;
            return (
              <TouchableOpacity
                onPress={() => setSelected(item.code)}
                activeOpacity={0.7}
                className={`flex-row items-center px-5 py-4 rounded-[20px] border-[1.5px] transition-all ${
                  isSelected ? 'bg-dark border-dark shadow-sm' : 'bg-card border-card-deep'
                }`}
              >
                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${isSelected ? 'bg-budgy-lime/20' : 'bg-bg'}`}>
                  <Text className={`text-xl font-bold ${isSelected ? 'text-budgy-lime' : 'text-secondary'}`}>{item.symbol}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-bold ${isSelected ? 'text-bg' : 'text-text'}`}>{item.code}</Text>
                  <Text className={`text-sm font-medium mt-0.5 ${isSelected ? 'text-bg/70' : 'text-secondary'}`}>{item.name}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color="#C8F560" />}
              </TouchableOpacity>
            );
          }}
        />

        <View className="pt-4 pb-2">
          <Button title="Continue" onPress={handleContinue} />
        </View>
      </View>
    </SafeAreaView>
  );
}