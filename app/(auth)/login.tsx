import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(onboarding)/step-1-currency');
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="flex-grow px-6 pb-12 pt-24" showsVerticalScrollIndicator={false}>
        
        <View className="mb-10">
          <View className="w-16 h-16 rounded-2xl bg-budgy-lime/20 items-center justify-center mb-6">
            <Ionicons name="log-in" size={32} color="#9BC23A" />
          </View>
          <Text className="text-text text-4xl font-extrabold tracking-tight leading-tight">Welcome{'\n'}Back</Text>
          <Text className="text-secondary text-base font-medium mt-3">Enter your details to access your dashboard.</Text>
        </View>

        <View className="gap-5 mb-8">
          {/* Email Input */}
          <View className="w-full">
            <Text className="text-text text-sm font-bold mb-2 ml-1 tracking-wide">Email Address</Text>
            <View className="flex-row items-center h-14 rounded-2xl bg-card border-[1.5px] border-card-deep px-4 focus:border-dark transition-colors">
              <Ionicons name="mail-outline" size={20} color="#9DA28F" className="mr-3" />
              <TextInput
                className="flex-1 text-text text-base font-medium h-full ml-3"
                placeholder="you@example.com"
                placeholderTextColor="#9DA28F"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="w-full">
            <Text className="text-text text-sm font-bold mb-2 ml-1 tracking-wide">Password</Text>
            <View className="flex-row items-center h-14 rounded-2xl bg-card border-[1.5px] border-card-deep px-4 focus:border-dark transition-colors">
              <Ionicons name="lock-closed-outline" size={20} color="#9DA28F" className="mr-3" />
              <TextInput
                className="flex-1 text-text text-base font-medium h-full ml-3"
                placeholder="••••••••"
                placeholderTextColor="#9DA28F"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9DA28F" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Primary CTA */}
        <Pressable 
          onPress={handleLogin}
          className="w-full h-[56px] bg-budgy-lime rounded-2xl items-center justify-center shadow-sm active:opacity-80"
        >
          <Text className="text-[#1A1E14] text-[16px] font-extrabold tracking-wide">Log In</Text>
        </Pressable>

        {/* Divider */}
        <View className="flex-row items-center my-8 opacity-60">
          <View className="flex-1 h-[1px] bg-card-deep" />
          <Text className="mx-4 text-xs font-bold text-secondary uppercase tracking-widest">or</Text>
          <View className="flex-1 h-[1px] bg-card-deep" />
        </View>

        {/* Social / Biometric */}
        <View className="gap-4">
          <Pressable className="h-[56px] bg-card rounded-2xl border border-card-deep items-center justify-center flex-row active:bg-card-alt shadow-sm">
             <Ionicons name="logo-google" size={20} color="#4285F4" className="mr-3" />
             <Text className="text-text font-bold text-[15px] ml-2">Continue with Google</Text>
          </Pressable>
          <Pressable className="h-[56px] bg-card rounded-2xl border border-card-deep items-center justify-center flex-row active:bg-card-alt shadow-sm">
             <Ionicons name="finger-print" size={22} color="#1A1E14" className="dark:color-[#EDF0E4] mr-3" />
             <Text className="text-text font-bold text-[15px] ml-2">Use Biometrics</Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}