import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  // Animation values
  const glowAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(cardsAnim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.spring(textAnim, { toValue: 1, tension: 50, friction: 9, useNativeDriver: true }),
      Animated.spring(ctaAnim, { toValue: 1, tension: 50, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const slideUp = (anim: Animated.Value, yOffset = 30) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [yOffset, 0],
        }),
      },
    ],
  });

  return (
    <View className="flex-1 bg-[#090B07]">
      {/* ── Decorative Glows ── */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { opacity: glowAnim }]}>
        <View
          className="absolute -top-32 -right-20 rounded-full"
          style={{ width: width * 0.9, height: width * 0.9, backgroundColor: '#C8F560', opacity: 0.06 }}
        />
        <View
          className="absolute top-1/4 -left-32 rounded-full"
          style={{ width: width * 0.7, height: width * 0.7, backgroundColor: '#6BA3FF', opacity: 0.05 }}
        />
      </Animated.View>

      {/* ── Hero UI Composition ── */}
      <View className="flex-1 items-center justify-center pt-12">
        <Animated.View style={[{ position: 'relative', alignItems: 'center', justifyContent: 'center' }, slideUp(cardsAnim, 50)]}>
          
          {/* Main Mock Card */}
          <View className="bg-[#1A1E14] border border-[#2C3122] rounded-[32px] p-6 w-64 shadow-2xl items-center z-10">
            <View className="w-12 h-12 bg-budgy-lime/10 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="wallet" size={24} color="#C8F560" />
            </View>
            <Text className="text-[#8A8F7C] text-xs font-bold uppercase tracking-widest mb-1">Total Balance</Text>
            <Text className="text-[#EDF0E4] text-4xl font-extrabold tracking-tighter">₱24,500</Text>
            <View className="flex-row items-center gap-1.5 mt-4 bg-[#3DD97B]/10 px-3 py-1.5 rounded-full border border-[#3DD97B]/20">
              <Ionicons name="trending-up" size={14} color="#3DD97B" />
              <Text className="text-[#3DD97B] text-xs font-bold">+12.5% this month</Text>
            </View>
          </View>

          {/* Floating Element: Expense */}
          <View className="absolute -bottom-6 -left-12 bg-[#252A1C] border border-[#3A4030] rounded-2xl p-3 flex-row items-center gap-3 shadow-xl z-20">
            <View className="w-10 h-10 bg-[#FF6B6B]/10 rounded-xl items-center justify-center">
              <Ionicons name="restaurant" size={18} color="#FF6B6B" />
            </View>
            <View className="pr-2">
              <Text className="text-[#EDF0E4] text-sm font-bold">Dining</Text>
              <Text className="text-[#FF6B6B] text-xs font-bold tracking-tight">-₱850.00</Text>
            </View>
          </View>

          {/* Floating Element: Goal */}
          <View className="absolute -top-4 -right-10 bg-[#1A1E14] border border-[#2C3122] rounded-2xl p-3 flex-row items-center gap-3 shadow-xl z-0">
            <View className="w-10 h-10 bg-[#6BA3FF]/10 rounded-xl items-center justify-center">
              <Ionicons name="airplane" size={18} color="#6BA3FF" />
            </View>
            <View className="pr-2">
              <Text className="text-[#EDF0E4] text-sm font-bold">Travel Fund</Text>
              <Text className="text-[#8A8F7C] text-xs font-medium">80% reached</Text>
            </View>
          </View>

        </Animated.View>
      </View>

      {/* ── Main Content & CTA ── */}
      <SafeAreaView className="justify-end bg-gradient-to-t from-[#090B07] via-[#090B07] to-transparent">
        <View className="px-6 pb-8 pt-10">
          
          <Animated.View style={slideUp(textAnim)}>
            <View className="flex-row items-center gap-2.5 mb-4">
              <Image source={require('@/assets/images/logo2.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
              <Text className="text-xl font-extrabold text-[#EDF0E4] tracking-tight">budgy</Text>
            </View>

            <Text className="text-[40px] font-extrabold text-[#EDF0E4] leading-[46px] tracking-tighter mb-4">
              Take control of{'\n'}
              <Text className="text-budgy-lime">your money.</Text>
            </Text>
            
            <Text className="text-base text-[#8A8F7C] font-medium leading-relaxed mb-10 max-w-[90%]">
              Budget smarter, track your spending seamlessly, and reach your financial goals faster.
            </Text>
          </Animated.View>

          <Animated.View style={slideUp(ctaAnim, 20)}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              activeOpacity={0.8}
              className="h-14 rounded-2xl bg-budgy-lime items-center justify-center flex-row gap-2 shadow-lg"
            >
              <Text className="text-[#111410] text-[17px] font-extrabold tracking-wide">Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#111410" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
              className="items-center py-5 mt-2"
            >
              <Text className="text-[#8A8F7C] text-[15px] font-medium">
                Already have an account?{' '}
                <Text className="text-budgy-lime font-bold">Log in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}