import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';

export function SplashScreenView() {
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    // Initial pop-in animation for the logo
    logoScale.value = withSpring(1, { damping: 15, stiffness: 120 });
    logoOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
      opacity: logoOpacity.value,
    };
  });

  return (
    <View style={s.container}>
      {/* Subtle decorative background glows */}
      <View style={s.glowTop} />
      <View style={s.glowBottom} />

      <View style={s.content}>
        {/* Logo Card */}
        <Animated.View style={[s.logoWrapper, animatedLogoStyle]}>
          <Image
            source={require('@/assets/images/logo2.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Name (Staggered slide up) */}
        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
          <View style={s.brandWrap}>
            <View style={s.brandDot} />
            <Text style={s.brandWord}>BUDGY</Text>
          </View>
        </Animated.View>

        {/* Tagline (Delayed fade in) */}
        <Animated.View entering={FadeIn.delay(500).duration(600)}>
          <Text style={s.tagline}>Smart money, simple life</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1E14', // Deep dark forest base
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(200, 245, 96, 0.04)', // Subtle lime glow
  },
  glowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(200, 245, 96, 0.02)',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoWrapper: {
    width: 130,
    height: 130,
    borderRadius: 36,
    backgroundColor: '#222618', // Card surface
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2C3122',
    // Subtle shadow to lift it off the background
    shadowColor: '#C8F560',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  logo: {
    width: 84,
    height: 84,
    marginLeft: 8, // Optical adjustment if the bird is slightly off-center
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#C8F560',
    marginRight: 12,
  },
  brandWord: {
    color: '#EDF0E4',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
  },
  tagline: {
    color: '#8A8F7C',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
