import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
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
import { supabase } from '@/lib/supabase';

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

function UnderlineInput({
  label, value, onChangeText, error, secureTextEntry,
  rightElement, keyboardType, autoCapitalize, autoComplete, placeholder,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
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
          onBlur={() => setFocused(false)}
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

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUpWithEmail, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'At least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setApiError('');
    setSuccessMsg('');
    setLoading(true);
    const { error } = await signUpWithEmail(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setApiError(error);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSuccessMsg('Account created! Check your email to confirm before signing in.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  const clearError = (field: string) =>
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });

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
        {/* Brand */}
        <View style={s.headerBrand}>
          <View style={s.brandDot} />
          <Text style={s.brandWord}>BUDGY</Text>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={s.headerTitle}>Create your{'\n'}account.</Text>
          <Text style={s.headerSub}>Start taking control of your money today.</Text>
        </Animated.View>
      </Animated.View>

      {/* ── Form ────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error banner */}
        {apiError ? (
          <Animated.View entering={FadeInDown.duration(300)} style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
            <Text style={s.errorText}>{apiError}</Text>
          </Animated.View>
        ) : null}

        {/* Success banner */}
        {successMsg ? (
          <Animated.View entering={FadeInDown.duration(300)} style={s.successBanner}>
            <Ionicons name="mail-outline" size={16} color="#C8F560" />
            <Text style={s.successText}>{successMsg}</Text>
          </Animated.View>
        ) : null}

        <UnderlineInput
          label="Full name"
          value={fullName}
          onChangeText={t => { setFullName(t); clearError('fullName'); }}
          error={errors.fullName}
          autoCapitalize="words"
          autoComplete="name"
          placeholder="Jane Dela Cruz"
        />

        <UnderlineInput
          label="Email address"
          value={email}
          onChangeText={t => { setEmail(t); clearError('email'); }}
          error={errors.email}
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@example.com"
        />

        <UnderlineInput
          label="Password"
          value={password}
          onChangeText={t => { setPassword(t); clearError('password'); }}
          error={errors.password}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          rightElement={
            <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={10}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18} color="#9DA28F"
              />
            </Pressable>
          }
        />

        {/* Create account button */}
        <Pressable
          onPress={handleSignup}
          disabled={loading || googleLoading}
          style={[s.primaryBtn, (loading || googleLoading) && { opacity: 0.7 }]}
        >
          {loading
            ? <ActivityIndicator color="#1A1E14" />
            : <Text style={s.primaryBtnText}>Create Account</Text>}
        </Pressable>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Google */}
        <Pressable
          onPress={handleGoogle}
          disabled={loading || googleLoading}
          style={[s.googleBtn, (loading || googleLoading) && { opacity: 0.6 }]}
        >
          {googleLoading
            ? <ActivityIndicator color="#6B7060" size="small" />
            : <>
                <Ionicons name="logo-google" size={18} color="#6B7060" />
                <Text style={s.googleBtnText}>Continue with Google</Text>
              </>
          }
        </Pressable>

        {/* Footer link */}
        <View style={s.footer}>
          <Text style={s.footerText}>Already a member?</Text>
          <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={8}>
            <Text style={s.footerLink}>  Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Shared field styles ─────────────────────────
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

// ── Screen styles ───────────────────────────────
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
  brandDot: {
    width: 7, height: 7, borderRadius: 2,
    backgroundColor: '#C8F560', marginRight: 10,
  },
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

  // Banners
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 24,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, fontWeight: '500', flex: 1 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(200,245,96,0.08)',
    borderWidth: 1, borderColor: 'rgba(200,245,96,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 24,
  },
  successText: { color: '#9BC23A', fontSize: 13, fontWeight: '500', flex: 1 },

  // Buttons
  primaryBtn: {
    backgroundColor: '#C8F560', borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  primaryBtnText: { color: '#1A1E14', fontSize: 16, fontWeight: '800', letterSpacing: 0.1 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E4E6D6' },
  dividerText: { color: '#9DA28F', fontSize: 12, fontWeight: '600', letterSpacing: 1 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E4E6D6', borderRadius: 16, height: 52,
    backgroundColor: '#fff', marginBottom: 32,
  },
  googleBtnText: { color: '#1A1E14', fontSize: 15, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#9DA28F', fontSize: 14, fontWeight: '500' },
  footerLink: { color: '#1A1E14', fontSize: 14, fontWeight: '700' },
});
