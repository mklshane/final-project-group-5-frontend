import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, withSpring, useAnimatedStyle,
  configureReanimatedLogger, ReanimatedLogLevel,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  return (
    <View style={[s.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>

      {/* Concentric circle decorations — top right */}
      <View style={s.ringOuter} />
      <View style={s.ringMid} />
      <View style={s.ringInner} />

      {/* ── Brand mark ─────────────────────────────── */}
      <Animated.View entering={FadeIn.duration(500)} style={s.brand}>
        <View style={s.brandDot} />
        <Text style={s.brandWord}>BUDGY</Text>
      </Animated.View>

      {/* ── Main content (centered) ─────────────────── */}
      <View style={s.middle}>

        {/* Balance preview card */}
        <Animated.View entering={FadeInDown.delay(150).duration(600).springify()} style={s.card}>
          <Text style={s.cardLabel}>TOTAL BALANCE</Text>
          <Text style={s.cardBalance}>₱50,000.00</Text>

          {/* Spending bar */}
          <View style={s.barTrack}>
            <View style={s.barFill} />
          </View>

          <View style={s.cardMeta}>
            <Text style={s.cardMetaLeft}>₱31,200 spent</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>↑ 12% this month</Text>
            </View>
          </View>
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
  brandDot: {
    width: 7, height: 7, borderRadius: 2,
    backgroundColor: '#C8F560', marginRight: 10,
  },
  brandWord: {
    color: '#EDF0E4', fontSize: 11, fontWeight: '800', letterSpacing: 4,
  },

  // Middle section
  middle: { flex: 1, justifyContent: 'center', gap: 32 },

  // Balance card
  card: {
    backgroundColor: '#222618',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C3122',
    padding: 22,
  },
  cardLabel: {
    color: '#585D4C', fontSize: 10, fontWeight: '700',
    letterSpacing: 2.5, marginBottom: 6,
  },
  cardBalance: {
    color: '#EDF0E4', fontSize: 36, fontWeight: '800',
    letterSpacing: -1, marginBottom: 22,
  },
  barTrack: {
    height: 3, backgroundColor: '#2C3122',
    borderRadius: 2, marginBottom: 12,
  },
  barFill: {
    width: '62%', height: 3, backgroundColor: '#C8F560', borderRadius: 2,
  },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMetaLeft: { color: '#585D4C', fontSize: 12, fontWeight: '500' },
  badge: {
    backgroundColor: 'rgba(200,245,96,0.12)',
    borderRadius: 100, borderWidth: 1, borderColor: 'rgba(200,245,96,0.25)',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { color: '#C8F560', fontSize: 11, fontWeight: '700' },

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
