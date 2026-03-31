import { useState } from 'react';
import {
  View,
  Text,
  Image,
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

  const handleGoogle = async () => {
    setApiError('');
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setApiError(error);
  };

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
        <View className="px-6 pt-20 pb-10">
          <Image
            source={require('@/assets/images/logo2.png')}
            style={{ width: 64, height: 64, marginBottom: 24 }}
            resizeMode="contain"
          />
          <Text className="text-text text-3xl font-bold">Welcome back</Text>
          <Text className="text-secondary text-base mt-2">Sign in to your account</Text>
        </View>

        {/* Form */}
        <View className="px-6 gap-4">
          {apiError ? (
            <View className="bg-budgy-red/10 border border-budgy-red rounded-2xl px-4 py-3">
              <Text className="text-budgy-red text-sm">{apiError}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(''); }}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={18} color="#9DA28F" />}
          />

          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
            error={passwordError}
            secureTextEntry={!showPassword}
            autoComplete="password"
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#9DA28F" />}
            rightIcon={
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#9DA28F"
              />
            }
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          <View className="gap-3 mt-2">
            <Button title="Log In" onPress={handleLogin} loading={loading} disabled={googleLoading} />
            <Button title="Continue with Google" onPress={handleGoogle} variant="google" loading={googleLoading} disabled={loading} />
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center mt-8 px-6">
          <Text className="text-secondary text-sm">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')} activeOpacity={0.7}>
            <Text className="text-budgy-lime text-sm font-semibold">Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
