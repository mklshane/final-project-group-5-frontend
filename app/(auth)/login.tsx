import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Image,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn,
  configureReanimatedLogger, ReanimatedLogLevel,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

function UnderlineInput({
  label, value, onChangeText, onBlur, error, secureTextEntry,
  rightElement, keyboardType, autoCapitalize, autoComplete, placeholder,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  onBlur?: () => void;
  error?: string; secureTextEntry?: boolean; rightElement?: React.ReactNode;
  keyboardType?: any; autoCapitalize?: any; autoComplete?: any; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.fieldWrap}>
      <Text style={[f.fieldLabel, error && f.fieldLabelError, focused && f.fieldLabelFocused]}>
        {label}
      </Text>
      <View style={[f.inputRow, { borderBottomColor: error ? '#FF6B6B' : focused ? '#C8F560' : '#E4E6D6' }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          placeholderTextColor="#C8CCB8"
          style={f.input}
        />
        {rightElement}
      </View>
      {error ? <Text style={f.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithEmail } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: LoginSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setApiError('');
      setLoading(true);
      const { error: authError } = await signInWithEmail(values.email.trim(), values.password);
      setLoading(false);
      if (authError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setApiError(authError);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F4F5E9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[s.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={s.headerBrand}>
          <Image source={require('../../assets/images/logo2.png')} style={s.brandLogo} resizeMode="contain" />
          <Text style={s.brandWord}>BUDGY</Text>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={s.headerTitle}>Welcome{'\n'}back.</Text>
          <Text style={s.headerSub}>Sign in to continue tracking your money.</Text>
        </Animated.View>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {apiError ? (
          <Animated.View entering={FadeInDown.duration(300)} style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
            <Text style={s.errorText}>{apiError}</Text>
          </Animated.View>
        ) : null}

        <UnderlineInput
          label="Email address"
          value={formik.values.email}
          onChangeText={formik.handleChange('email')}
          onBlur={() => formik.setFieldTouched('email', true)}
          error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@example.com"
        />

        <UnderlineInput
          label="Password"
          value={formik.values.password}
          onChangeText={formik.handleChange('password')}
          onBlur={() => formik.setFieldTouched('password', true)}
          error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}
          secureTextEntry={!showPassword}
          autoComplete="password"
          placeholder="••••••••"
          rightElement={
            <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={10}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={18} color="#9DA28F"
              />
            </Pressable>
          }
        />

        <Pressable
          onPress={() => formik.handleSubmit()}
          disabled={loading}
          style={[s.primaryBtn, loading && { opacity: 0.7 }]}
        >
          {loading
            ? <ActivityIndicator color="#1A1E14" />
            : <Text style={s.primaryBtnText}>Sign In</Text>}
        </Pressable>

        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account?</Text>
          <Pressable onPress={() => router.push('/(auth)/signup')} hitSlop={8}>
            <Text style={s.footerLink}>  Create one</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const f = StyleSheet.create({
  fieldWrap: { marginBottom: 28 },
  fieldLabel: {
    color: '#9DA28F', fontSize: 10, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10,
  },
  fieldLabelFocused: { color: '#1A1E14' },
  fieldLabelError: { color: '#FF6B6B' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5, paddingBottom: 10,
  },
  input: {
    flex: 1, color: '#1A1E14', fontSize: 16,
    fontWeight: '500', paddingVertical: 0,
  },
  fieldError: { color: '#FF6B6B', fontSize: 12, fontWeight: '500', marginTop: 6 },
});

const s = StyleSheet.create({
  header: {
    backgroundColor: '#1A1E14',
    paddingHorizontal: 28,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerBrand: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 28,
  },
  brandLogo: { width: 22, height: 22, marginRight: 10 },
  brandWord: {
    color: '#EDF0E4', fontSize: 11, fontWeight: '800', letterSpacing: 4,
  },
  headerTitle: {
    color: '#EDF0E4', fontSize: 40, fontWeight: '800',
    letterSpacing: -1, lineHeight: 46, marginBottom: 10,
  },
  headerSub: {
    color: '#585D4C', fontSize: 14, fontWeight: '500', lineHeight: 21,
  },
  form: { paddingHorizontal: 28, paddingTop: 36 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 24,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, fontWeight: '500', flex: 1 },
  primaryBtn: {
    backgroundColor: '#C8F560', borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  primaryBtnText: { color: '#1A1E14', fontSize: 16, fontWeight: '800', letterSpacing: 0.1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#9DA28F', fontSize: 14, fontWeight: '500' },
  footerLink: { color: '#1A1E14', fontSize: 14, fontWeight: '700' },
});
