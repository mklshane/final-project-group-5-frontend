import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, withSpring, useAnimatedStyle,
  configureReanimatedLogger, ReanimatedLogLevel,
  withRepeat, withTiming, Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Button tap scale
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  // Continuous floating animations for illustration elements
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  useEffect(() => {
    // Smooth, staggered breathing animations
    float1.value = withRepeat(withTiming(8, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
    
    setTimeout(() => {
      float2.value = withRepeat(withTiming(-10, { duration: 2800, easing: Easing.inOut(Easing.ease) }), -1, true);
    }, 400);

    setTimeout(() => {
      float3.value = withRepeat(withTiming(12, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true);
    }, 800);
  }, []);

  const animCardBack = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }, { rotate: '-14deg' }] }));
  const animCardFront = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }] }));
  const animCoin1 = useAnimatedStyle(() => ({ transform: [{ translateY: float3.value }] }));
  const animCoin2 = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }] }));
  const animPill = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }, { rotate: '6deg' }] }));

  return (
    <View style={[s.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>

      {/* Concentric circle decorations — top right */}
      <View style={s.ringOuter} />
      <View style={s.ringMid} />
      <View style={s.ringInner} />

      {/* ── Brand mark ─────────────────────────────── */}
      <Animated.View entering={FadeIn.duration(500)} style={s.brand}>
        <Image source={require('../../assets/images/logo2.png')} style={s.brandLogo} resizeMode="contain" />
        <Text style={s.brandWord}>BUDGY</Text>
      </Animated.View>

      {/* ── Main content (centered) ─────────────────── */}
      <View style={s.middle}>

        {/* Floating Abstract Illustration */}
        <Animated.View entering={FadeInDown.delay(150).duration(800).springify()} style={s.illContainer}>
          
          {/* Back Card (Lime Credit Card) */}
          <Animated.View style={[s.illCardBack, animCardBack]}>
            <View style={s.illCardBackStripe} />
            <Ionicons name="wifi" size={24} color="rgba(26,30,20,0.2)" style={{ transform: [{ rotate: '90deg' }] }} />
          </Animated.View>

          {/* Front Card (Dark Digital Wallet) */}
          <Animated.View style={[s.illCardFront, animCardFront]}>
            <View style={s.illCardFrontHeader}>
               <Ionicons name="wallet" size={28} color="#C8F560" />
               <View style={s.illCardFrontDot} />
            </View>
            <View style={s.illCardFrontLine1} />
            <View style={s.illCardFrontLine2} />
          </Animated.View>

          {/* Floating Coin 1 (Gold/Orange) */}
          <Animated.View style={[s.illCoin1, animCoin1]}>
            <Ionicons name="logo-bitcoin" size={20} color="#FFAD5C" />
          </Animated.View>

          {/* Floating Coin 2 (Green Currency) */}
          <Animated.View style={[s.illCoin2, animCoin2]}>
            <Text style={s.illCoinText}>₱</Text>
          </Animated.View>

          {/* Floating Success Pill */}
          <Animated.View style={[s.illPill, animPill]}>
            <Ionicons name="trending-up" size={14} color="#1A1E14" />
            <Text style={s.illPillText}>+24%</Text>
          </Animated.View>

        </Animated.View>

        {/* Headline */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text style={s.headline}>Your finances,{'\n'}finally clear.</Text>
          <Text style={s.subline}>
            Track every peso, set smart budgets,{'\n'}and reach your goals — all in one place.
          </Text>
        </Animated.View>
      </View>

      {/* ── CTA ────────────────────────────────────── */}
      <Animated.View entering={FadeIn.delay(500).duration(500)} style={s.cta}>

        <Animated.View style={btnStyle}>
          <Pressable
            onPressIn={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              btnScale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
            }}
            onPressOut={() => {
              btnScale.value = withSpring(1, { damping: 20, stiffness: 300 });
              router.push('/(auth)/signup');
            }}
            style={s.ctaBtn}
          >
            <Text style={s.ctaBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={17} color="#1A1E14" />
          </Pressable>
        </Animated.View>

        <Pressable
          onPress={() => router.push('/(auth)/login')}
          style={s.signInLink}
          hitSlop={12}
        >
          <Text style={s.signInLinkText}>
            Already a member?{'  '}
            <Text style={s.signInLinkAccent}>Sign in</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1E14',
    paddingHorizontal: 28,
  },

  // Decorative rings
  ringOuter: {
    position: 'absolute', top: -120, right: -120,
    width: 340, height: 340, borderRadius: 170,
    borderWidth: 1, borderColor: '#C8F560', opacity: 0.10,
  },
  ringMid: {
    position: 'absolute', top: -50, right: -50,
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: '#C8F560', opacity: 0.08,
  },
  ringInner: {
    position: 'absolute', top: 10, right: 10,
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1, borderColor: '#C8F560', opacity: 0.06,
  },

  // Brand
  brand: { flexDirection: 'row', alignItems: 'center', marginBottom: 48 },
  brandLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  brandWord: {
    color: '#EDF0E4', fontSize: 11, fontWeight: '800', letterSpacing: 4,
  },

  // Middle section
  middle: { flex: 1, justifyContent: 'center', gap: 32 },

  // ── Illustration Styles ────────────────────────
  illContainer: {
    height: 240,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  illCardBack: {
    position: 'absolute',
    width: 170,
    height: 110,
    backgroundColor: '#C8F560',
    borderRadius: 18,
    left: '10%',
    top: 20,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#C8F560',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  illCardBackStripe: {
    width: 32,
    height: 24,
    backgroundColor: 'rgba(26,30,20,0.15)',
    borderRadius: 6,
  },
  illCardFront: {
    position: 'absolute',
    width: 190,
    height: 120,
    backgroundColor: '#222618',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#3A402D',
    padding: 20,
    right: '8%',
    bottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
  },
  illCardFrontHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  illCardFrontDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#585D4C',
  },
  illCardFrontLine1: {
    width: '65%',
    height: 6,
    backgroundColor: '#3A402D',
    borderRadius: 3,
    marginBottom: 10,
  },
  illCardFrontLine2: {
    width: '45%',
    height: 6,
    backgroundColor: '#3A402D',
    borderRadius: 3,
  },
  illCoin1: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2F2518', // Dark tinted orange
    borderWidth: 1,
    borderColor: '#4A3B26',
    alignItems: 'center',
    justifyContent: 'center',
    top: 10,
    right: '25%',
  },
  illCoin2: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E2A22', // Dark tinted green
    borderWidth: 1,
    borderColor: '#2D4032',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 10,
    left: '15%',
  },
  illCoinText: {
    color: '#3DD97B',
    fontSize: 24,
    fontWeight: '800',
  },
  illPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF0E4', // Cream white for contrast
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    top: 110,
    left: '5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  illPillText: {
    color: '#1A1E14',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  // ───────────────────────────────────────────────

  // Headline
  headline: {
    color: '#EDF0E4', fontSize: 36, fontWeight: '800',
    letterSpacing: -0.8, lineHeight: 42, marginBottom: 12,
  },
  subline: {
    color: '#585D4C', fontSize: 14, fontWeight: '500', lineHeight: 22,
  },

  // CTA
  cta: { gap: 14, paddingTop: 8 },
  ctaBtn: {
    backgroundColor: '#C8F560', borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaBtnText: { color: '#1A1E14', fontSize: 16, fontWeight: '800', letterSpacing: 0.1 },
  signInLink: { alignItems: 'center', paddingVertical: 4 },
  signInLinkText: { color: '#585D4C', fontSize: 14, fontWeight: '500' },
  signInLinkAccent: { color: '#C8F560', fontWeight: '700' },
});