import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupScreen() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    const { error } = await signUpWithEmail(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) setApiError(error);
  };

  const handleGoogle = async () => {
    setApiError('');
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setApiError(error);
  };

  const clearError = (field: string) => setErrors((e) => { const n = { ...e }; delete n[field]; return n; });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-end pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-20 pb-8">
          <View className="w-16 h-16 rounded-2xl bg-budgy-lime items-center justify-center mb-6">
            <Text className="text-2xl font-bold text-dark">B</Text>
          </View>
          <Text className="text-text text-3xl font-bold">Create account</Text>
          <Text className="text-secondary text-base mt-2">Start your journey with Budgy</Text>
        </View>

        {/* Form */}
        <View className="px-6 gap-4">
          {apiError ? (
            <View className="bg-budgy-red/10 border border-budgy-red rounded-2xl px-4 py-3">
              <Text className="text-budgy-red text-sm">{apiError}</Text>
            </View>
          ) : null}

          <Input
            label="Full Name"
            placeholder="Jane Dela Cruz"
            value={fullName}
            onChangeText={(t) => { setFullName(t); clearError('fullName'); }}
            error={errors.fullName}
            autoCapitalize="words"
            autoComplete="name"
            leftIcon={<Ionicons name="person-outline" size={18} color="#9DA28F" />}
          />

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => { setEmail(t); clearError('email'); }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={18} color="#9DA28F" />}
          />

          <Input
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={(t) => { setPassword(t); clearError('password'); }}
            error={errors.password}
            secureTextEntry={!showPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#9DA28F" />}
            rightIcon={
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9DA28F" />
            }
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
            error={errors.confirmPassword}
            secureTextEntry={!showConfirm}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#9DA28F" />}
            rightIcon={
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9DA28F" />
            }
            onRightIconPress={() => setShowConfirm((v) => !v)}
          />

          <View className="gap-3 mt-2">
            <Button title="Create Account" onPress={handleSignup} loading={loading} disabled={googleLoading} />
            <Button title="Continue with Google" onPress={handleGoogle} variant="google" loading={googleLoading} disabled={loading} />
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center mt-8 px-6">
          <Text className="text-secondary text-sm">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text className="text-budgy-lime text-sm font-semibold">Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
