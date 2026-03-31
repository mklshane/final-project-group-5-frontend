import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) { setEmailError('Email is required'); valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email'); valid = false; }
    if (!password) { setPasswordError('Password is required'); valid = false; }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    const { error } = await signInWithEmail(email.trim(), password);
    setLoading(false);
    if (error) setApiError(error);
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="flex-grow pb-10" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-6 pt-24 pb-12">
          <View className="w-16 h-16 rounded-2xl bg-budgy-lime/20 items-center justify-center mb-6">
            <Ionicons name="log-in-outline" size={32} color="#9BC23A" />
          </View>
          <Text className="text-text text-4xl font-extrabold tracking-tight">Welcome{'\n'}Back</Text>
          <Text className="text-secondary text-base mt-3 leading-relaxed">Enter your details below to access your Budgy dashboard.</Text>
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
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(''); }}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={20} color="#9DA28F" />}
          />

          <View>
            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
              error={passwordError}
              secureTextEntry={!showPassword}
              autoComplete="password"
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9DA28F" />}
              rightIcon={<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9DA28F" />}
              onRightIconPress={() => setShowPassword((v) => !v)}
            />
            <TouchableOpacity className="self-end mt-3" activeOpacity={0.7}>
              <Text className="text-secondary font-medium text-sm">Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-4 gap-4">
            <Button title="Log In" onPress={handleLogin} loading={loading} disabled={googleLoading} />
            <View className="flex-row items-center my-2 opacity-60">
              <View className="flex-1 h-[1px] bg-card-deep" />
              <Text className="mx-4 text-xs font-bold text-secondary uppercase tracking-widest">or</Text>
              <View className="flex-1 h-[1px] bg-card-deep" />
            </View>
            <Button title="Continue with Google" onPress={signInWithGoogle} variant="google" loading={googleLoading} disabled={loading} />
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center mt-12 px-6">
          <Text className="text-secondary text-sm font-medium">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')} activeOpacity={0.7}>
            <Text className="text-dark dark:text-budgy-lime text-sm font-bold ml-1">Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}