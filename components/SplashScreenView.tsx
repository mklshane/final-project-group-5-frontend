import { View, Text, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export function SplashScreenView() {
  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <Animated.View entering={FadeIn.duration(600)} className="items-center">
        <Image
          source={require('@/assets/images/logo2.png')}
          style={{ width: 100, height: 100, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text className="text-budgy-lime text-3xl font-bold text-center">budgy</Text>
        <Text className="text-secondary text-sm text-center mt-2">smart money, simple life</Text>
      </Animated.View>
    </View>
  );
}
