import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <Text className="text-text text-2xl font-extrabold tracking-tight">Profile</Text>
        
        <TouchableOpacity 
          onPress={signOut}
          activeOpacity={0.7}
          className="flex-row items-center justify-center w-full bg-card border border-card-deep rounded-2xl h-[56px] mt-4"
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
          <Text className="text-budgy-red text-base font-bold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}