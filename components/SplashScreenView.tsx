import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export function SplashScreenView() {
  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <Animated.View entering={FadeIn.duration(600)} className="items-center">
        <View className="w-24 h-24 rounded-full bg-budgy-lime items-center justify-center mb-4">
          <Text className="text-4xl font-bold text-dark">B</Text>
        </View>
        <Text className="text-budgy-lime text-3xl font-bold text-center">budgy</Text>
        <Text className="text-secondary text-sm text-center mt-2">smart money, simple life</Text>
      </Animated.View>
    </View>
  );
}
