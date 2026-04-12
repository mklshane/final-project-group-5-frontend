import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export function SplashScreenView() {
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    // Smooth, refined scale and fade for a premium SaaS feel
    logoScale.value = withSpring(1, { damping: 20, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
      opacity: logoOpacity.value,
    };
  });

  return (
    <View style={s.container}>
      {/* Refined central ambient glow behind the logo */}
      <View style={s.centerGlow} />

      <View style={s.content}>
        {/* Logo without the bounding box */}
        <Animated.View style={[s.logoContainer, animatedLogoStyle]}>
          <Image
            source={require('@/assets/images/logo2.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Name (Staggered slide up) */}
        <Animated.View entering={FadeInDown.delay(200).duration(800).springify()}>
          <View style={s.brandWrap}>
            <View style={s.brandDot} />
            <Text style={s.brandWord}>BUDGY</Text>
          </View>
        </Animated.View>

        {/* Tagline (Delayed elegant fade in) */}
        <Animated.View entering={FadeIn.delay(500).duration(800)}>
          <Text style={s.tagline}>Smart money, simple life</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111410', // Deep dark theme background matching the app
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#C8F560', // budgy-lime
    opacity: 0.04, // Very subtle
    transform: [{ scaleY: 0.8 }], // Slightly elliptical
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 110,
    height: 110,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8F560',
    marginRight: 10,
  },
  brandWord: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
  },
  tagline: {
    color: '#8A8F7C', // Secondary text color mapped from the theme
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});