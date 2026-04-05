import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, useSharedValue, withSpring, useAnimatedStyle, configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const scale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.97, { damping: 10, stiffness: 20 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 20 });
    router.push('/(auth)/login');
  };

  return (
    <View style={{ flex: 1 }} className="bg-bg">
      {/* Decorative Background Elements using theme accents (Lime & Green) */}
      <View className="absolute top-[-10%] left-[-10%] w-[120%] h-[60%] bg-[#C8F560]/20 rounded-full blur-3xl" />
      <View className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[40%] bg-[#3DD97B]/10 rounded-full blur-3xl" />

      <View style={{ flex: 1 }} className="items-center justify-center px-6">
        <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center">
          
          {/* Theme-matched Icon Container */}
          <View className="w-24 h-24 bg-card border-[2px] border-card-deep rounded-[32px] items-center justify-center shadow-sm mb-8">
            <Ionicons name="wallet" size={48} color="#9BC23A" />
          </View>
          
          <Text className="text-text text-5xl font-extrabold tracking-tighter text-center leading-[56px]">
            Master your{'\n'}
            {/* Using the dark lime accent for better contrast on light backgrounds */}
            <Text className="text-[#9BC23A]">financial life.</Text>
          </Text>
          
          <Text className="text-secondary text-lg mt-4 text-center px-4 font-medium leading-relaxed">
            Beautiful analytics, smart budgets, and effortless tracking. All in one place.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(400).duration(600)} className="px-6 pb-12 pt-4">
        <Animated.View style={buttonStyle}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className="w-full h-[56px] bg-[#C8F560] rounded-2xl items-center justify-center flex-row shadow-sm active:opacity-80"
          >
            <Text className="text-[#1A1E14] text-[16px] font-extrabold tracking-wide mr-2">
              Get Started
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#1A1E14" />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}