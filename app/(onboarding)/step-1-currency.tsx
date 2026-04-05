import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
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
  const insets = useSafeAreaInsets();
  const store = useOnboardingStore();
  const [selected, setSelected] = useState(CURRENCIES[0]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.set({ currency: selected.code });
    router.push('/(onboarding)/step-2-balance');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F5E9' }}>
      {/* ── Dark header ─────────────────────────────── */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[s.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={s.headerTop}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: '50%' }]} />
          </View>
          <Text style={s.stepText}>STEP 1 OF 2</Text>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={s.headerTitle}>Base{'\n'}currency.</Text>
          <Text style={s.headerSub}>Select your main currency for tracking. You cannot change this later.</Text>
        </Animated.View>
      </Animated.View>

      {/* ── Clean List Form ─────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {CURRENCIES.map((item, index) => {
          const isActive = item.code === selected.code;
          return (
            <Animated.View key={item.code} entering={FadeInDown.delay(200 + (index * 50)).duration(400)}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelected(item);
                }}
                style={[s.currencyRow, isActive && s.currencyRowActive]}
              >
                <Text style={[s.currencySymbol, isActive && s.currencySymbolActive]}>
                  {item.symbol}
                </Text>
                <View style={s.currencyInfo}>
                  <Text style={[s.currencyCode, isActive && s.currencyCodeActive]}>{item.code}</Text>
                  <Text style={s.currencyName}>{item.name}</Text>
                </View>
                {isActive && (
                  <Animated.View entering={FadeIn.duration(200)}>
                    <Ionicons name="checkmark" size={24} color="#1A1E14" />
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* ── Pinned Footer ────────────────────────────── */}
      <View style={[s.footerFloat, { paddingBottom: insets.bottom || 24 }]}>
        <Pressable onPress={handleContinue} style={s.primaryBtn}>
          <Text style={s.primaryBtnText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#1A1E14',
    paddingHorizontal: 28,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16,
  },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: '#2C3122', borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#C8F560', borderRadius: 2,
  },
  stepText: {
    color: '#9DA28F', fontSize: 10, fontWeight: '800', letterSpacing: 2,
  },
  headerTitle: {
    color: '#EDF0E4', fontSize: 40, fontWeight: '800',
    letterSpacing: -1, lineHeight: 46, marginBottom: 10,
  },
  headerSub: {
    color: '#585D4C', fontSize: 14, fontWeight: '500', lineHeight: 21,
  },

  form: { paddingHorizontal: 28, paddingTop: 24 },
  
  currencyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1.5, borderBottomColor: '#E4E6D6',
  },
  currencyRowActive: {
    borderBottomColor: '#1A1E14',
  },
  currencySymbol: {
    fontSize: 24, fontWeight: '800', color: '#9DA28F', width: 44,
  },
  currencySymbolActive: {
    color: '#1A1E14',
  },
  currencyInfo: { flex: 1 },
  currencyCode: { 
    fontSize: 18, fontWeight: '800', color: '#1A1E14', marginBottom: 2 
  },
  currencyCodeActive: {
    color: '#1A1E14',
  },
  currencyName: { 
    fontSize: 13, fontWeight: '500', color: '#6B7060' 
  },

  footerFloat: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 28, paddingTop: 16,
    backgroundColor: 'rgba(244,245,233,0.95)',
  },
  primaryBtn: {
    backgroundColor: '#C8F560', borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { 
    color: '#1A1E14', fontSize: 16, fontWeight: '800', letterSpacing: 0.1 
  },
});