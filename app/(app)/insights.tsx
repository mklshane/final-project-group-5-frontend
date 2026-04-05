import { View, Text, SafeAreaView } from 'react-native';

export default function InsightsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center">
        <Text className="text-text text-2xl font-extrabold tracking-tight">Insights</Text>
      </View>
    </SafeAreaView>
  );
}