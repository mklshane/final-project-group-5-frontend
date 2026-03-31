import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
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
  const [showPassword, setShowPassword] = useState(false);

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
    else if (password.length < 8) e.password = 'Must be at least 8 characters';
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

  const clearError = (field: string) => setErrors((e) => { const n = { ...e }; delete n[field]; return n; });

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="flex-grow pb-10" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-6 pt-20 pb-8">
          <View className="w-16 h-16 rounded-2xl bg-dark items-center justify-center mb-6">
            <Ionicons name="sparkles" size={28} color="#C8F560" />
          </View>
          <Text className="text-text text-4xl font-extrabold tracking-tight">Create{'\n'}Account</Text>
          <Text className="text-secondary text-base mt-3 leading-relaxed">Start tracking your expenses and goals with Budgy today.</Text>
        </View>

        {/* Form */}
        <View className="px-6 gap-5">
          {apiError ? (
            <View className="bg-budgy-red/10 border border-budgy-red/30 rounded-2xl px-4 py-3 flex-row items-center gap-3">
              <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
              <Text className="text-budgy-red text-sm font-medium flex-1">{apiError}</Text>
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
            leftIcon={<Ionicons name="person-outline" size={20} color="#9DA28F" />}
          />

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => { setEmail(t); clearError('email'); }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={20} color="#9DA28F" />}
          />

          <Input
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={(t) => { setPassword(t); clearError('password'); }}
            error={errors.password}
            secureTextEntry={!showPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9DA28F" />}
            rightIcon={<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9DA28F" />}
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          <View className="mt-4 gap-4">
            <Button title="Create Account" onPress={handleSignup} loading={loading} disabled={googleLoading} />
            <Button title="Sign up with Google" onPress={signInWithGoogle} variant="google" loading={googleLoading} disabled={loading} />
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center mt-12 px-6">
          <Text className="text-secondary text-sm font-medium">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text className="text-dark dark:text-budgy-lime text-sm font-bold ml-1">Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}