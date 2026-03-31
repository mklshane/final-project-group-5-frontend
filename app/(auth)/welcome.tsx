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

const FEATURES = [
  { icon: 'trending-up-outline' as const, label: 'Track spending', color: '#C8F560', bg: '#C8F56020' },
  { icon: 'pie-chart-outline' as const, label: 'Set budgets', color: '#6BA3FF', bg: '#6BA3FF20' },
  { icon: 'notifications-outline' as const, label: 'Smart alerts', color: '#FFAD5C', bg: '#FFAD5C20' },
  { icon: 'shield-checkmark-outline' as const, label: 'Secure data', color: '#3DD97B', bg: '#3DD97B20' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  // Staggered fade-in values
  const blobAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(blobAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(featuresAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(ctaAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const fadeUp = (anim: Animated.Value, yOffset = 24) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [yOffset, 0] }) }],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#111410' }}>
      {/* ── Decorative blob layer ── */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.52 }, { opacity: blobAnim }]}>
        {/* Large lime glow top-right */}
        <View
          style={{
            position: 'absolute',
            top: -width * 0.2,
            right: -width * 0.15,
            width: width * 0.75,
            height: width * 0.75,
            borderRadius: width * 0.375,
            backgroundColor: '#C8F560',
            opacity: 0.08,
          }}
        />
        {/* Medium blue blob left */}
        <View
          style={{
            position: 'absolute',
            top: height * 0.08,
            left: -width * 0.2,
            width: width * 0.6,
            height: width * 0.6,
            borderRadius: width * 0.3,
            backgroundColor: '#6BA3FF',
            opacity: 0.07,
          }}
        />
        {/* Small orange accent */}
        <View
          style={{
            position: 'absolute',
            top: height * 0.22,
            right: width * 0.1,
            width: width * 0.25,
            height: width * 0.25,
            borderRadius: width * 0.125,
            backgroundColor: '#FFAD5C',
            opacity: 0.12,
          }}
        />

        {/* Floating category cards */}
        <Animated.View style={[{ position: 'absolute', top: height * 0.06, left: 28 }, fadeUp(blobAnim, 16)]}>
          <View style={{ backgroundColor: '#1A1E14', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#2C3122', flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#3DD97B20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="restaurant-outline" size={16} color="#3DD97B" />
            </View>
            <View>
              <Text style={{ color: '#8A8F7C', fontSize: 10 }}>Food & Dining</Text>
              <Text style={{ color: '#EDF0E4', fontSize: 13, fontWeight: '600' }}>₱2,400</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[{ position: 'absolute', top: height * 0.14, right: 24 }, fadeUp(blobAnim, 20)]}>
          <View style={{ backgroundColor: '#1A1E14', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#2C3122', flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#6BA3FF20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="car-outline" size={16} color="#6BA3FF" />
            </View>
            <View>
              <Text style={{ color: '#8A8F7C', fontSize: 10 }}>Transport</Text>
              <Text style={{ color: '#EDF0E4', fontSize: 13, fontWeight: '600' }}>₱850</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[{ position: 'absolute', top: height * 0.26, left: 40 }, fadeUp(blobAnim, 12)]}>
          <View style={{ backgroundColor: '#1A1E14', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#2C3122', flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#C8F56020', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trending-up-outline" size={16} color="#C8F560" />
            </View>
            <View>
              <Text style={{ color: '#8A8F7C', fontSize: 10 }}>Saved this month</Text>
              <Text style={{ color: '#C8F560', fontSize: 13, fontWeight: '600' }}>+₱5,200</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── Main content ── */}
      <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 36 }}>

          {/* Logo */}
          <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }, fadeUp(logoAnim)]}>
            <Image
              source={require('@/assets/images/logo2.png')}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#EDF0E4', letterSpacing: -1 }}>budgy</Text>
          </Animated.View>

          {/* Headline */}
          <Animated.View style={[{ marginBottom: 28 }, fadeUp(contentAnim)]}>
            <Text style={{ fontSize: 30, fontWeight: '800', color: '#EDF0E4', lineHeight: 38, letterSpacing: -0.5 }}>
              Take control of{'\n'}
              <Text style={{ color: '#C8F560' }}>your money.</Text>
            </Text>
            <Text style={{ fontSize: 15, color: '#8A8F7C', marginTop: 10, lineHeight: 22 }}>
              Budget smarter, spend better, and reach your financial goals — all in one place.
            </Text>
          </Animated.View>

          {/* Feature pills */}
          <Animated.View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 36 }, fadeUp(featuresAnim)]}>
            {FEATURES.map((f) => (
              <View
                key={f.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: f.bg,
                  borderRadius: 100,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: f.color + '30',
                }}
              >
                <Ionicons name={f.icon} size={13} color={f.color} />
                <Text style={{ color: f.color, fontSize: 12, fontWeight: '600' }}>{f.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* CTA */}
          <Animated.View style={[{ gap: 12 }, fadeUp(ctaAnim)]}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              activeOpacity={0.88}
              style={{
                height: 56,
                borderRadius: 18,
                backgroundColor: '#C8F560',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Text style={{ color: '#111410', fontSize: 16, fontWeight: '700' }}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#111410" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.75}
              style={{ alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: '#8A8F7C', fontSize: 14 }}>
                Already have an account?{' '}
                <Text style={{ color: '#C8F560', fontWeight: '600' }}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
