import React, { useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { CURRENCIES } from '@/constants/currencies';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const BalanceSchema = Yup.object().shape({
  balance: Yup.string()
    .test('is-valid-balance', 'Please enter a valid balance (0 or more)', value => {
      const amount = parseFloat((value ?? '').replace(/,/g, ''));
      return !isNaN(amount) && amount >= 0;
    })
    .required('Please enter a balance'),
});

export default function Step2Balance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, refreshProfile } = useAuth();
  const store = useOnboardingStore();

  const { currency } = store.get();
  const currencyInfo = CURRENCIES.find((c) => c.code === currency);
  const symbol = currencyInfo?.symbol ?? currency;

  const inputRef = useRef<TextInput>(null);

  // Auto-focus for a seamless transition
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  const formik = useFormik({
    initialValues: { balance: '' },
    validationSchema: BalanceSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      const amount = parseFloat(values.balance.replace(/,/g, ''));
      if (isNaN(amount) || amount < 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/complete-onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session!.access_token}`,
          },
          body: JSON.stringify({
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
          formik.setFieldError('balance', data?.error ?? 'Something went wrong. Please try again.');
          formik.setFieldTouched('balance', true, false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch {
        formik.setFieldError('balance', 'Network error. Check your connection.');
        formik.setFieldTouched('balance', true, false);
      }
    },
  });

  const handleBalanceChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    formik.setFieldValue('balance', cleaned);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F4F5E9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Dark header ─────────────────────────────── */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[s.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={s.headerTop}>
          <Pressable onPress={() => router.back()} hitSlop={15} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color="#EDF0E4" />
          </Pressable>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: '100%' }]} />
          </View>
          <Text style={s.stepText}>STEP 2 OF 2</Text>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={s.headerTitle}>Current{'\n'}balance.</Text>
          <Text style={s.headerSub}>How much do you have right now?</Text>
        </Animated.View>
      </Animated.View>

      {/* ── Content ─────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.inputWrap}>
          <Text style={[s.inputSymbol, !formik.values.balance && { color: '#C8CCB8' }]}>{symbol}</Text>
          <TextInput
            ref={inputRef}
            value={formik.values.balance}
            onChangeText={handleBalanceChange}
            keyboardType="decimal-pad"
            inputMode="decimal"
            placeholder="0.00"
            placeholderTextColor="#C8CCB8"
            selectionColor="#1A1E14"
            style={s.massiveInput}
          />
        </View>

        {formik.touched.balance && formik.errors.balance ? (
          <Text style={s.inlineError}>{formik.errors.balance}</Text>
        ) : null}

        <View style={s.chipRow}>
          {['1000', '5000', '10000', '50000'].map(amt => (
            <Pressable
              key={amt}
              onPress={() => {
                Haptics.selectionAsync();
                formik.setFieldValue('balance', amt);
                formik.setFieldTouched('balance', true);
              }}
              style={s.chip}
            >
              <Text style={s.chipText}>+{symbol}{parseInt(amt).toLocaleString()}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* ── Pinned Footer ────────────────────────────── */}
      <View style={[s.footerFloat, { paddingBottom: insets.bottom || 24 }]}>
        <Pressable
          onPress={() => formik.handleSubmit()}
          disabled={formik.isSubmitting}
          style={[s.primaryBtn, formik.isSubmitting && { opacity: 0.7 }]}
        >
          {formik.isSubmitting
            ? <ActivityIndicator color="#1A1E14" />
            : <Text style={s.primaryBtnText}>Complete Setup</Text>
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  backBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#2C3122',
    alignItems: 'center', justifyContent: 'center',
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

  form: { paddingHorizontal: 28, paddingTop: 36 },

  inlineError: {
    color: '#FF6B6B', fontSize: 13, fontWeight: '500', marginTop: 8,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#E4E6D6',
    paddingBottom: 8, marginBottom: 0, marginTop: 12,
  },
  inputSymbol: {
    fontSize: 48, fontWeight: '800', color: '#1A1E14', marginRight: 12,
  },
  massiveInput: {
    flex: 1, fontSize: 48, fontWeight: '800', color: '#1A1E14',
    height: 64, padding: 0, margin: 0,
  },

  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 32,
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1.5, borderColor: '#E4E6D6',
  },
  chipText: {
    fontSize: 14, fontWeight: '700', color: '#585D4C',
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
