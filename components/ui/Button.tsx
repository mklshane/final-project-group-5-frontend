import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Variant = 'primary' | 'outline' | 'google';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

const bg: Record<Variant, string> = {
  primary: 'bg-budgy-lime active:bg-budgy-lime-dark shadow-sm',
  outline: 'bg-transparent border-2 border-card-deep active:bg-card-alt',
  google: 'bg-card border border-card-deep active:bg-card-alt shadow-sm',
};

const fg: Record<Variant, string> = {
  primary: 'text-[#1A1E14] font-bold', // Always dark for contrast against lime
  outline: 'text-text font-bold',
  google: 'text-text font-semibold',
};

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center h-[56px] rounded-[18px] px-6 transition-all ${bg[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#1A1E14' : '#C8F560'} size="small" />
      ) : (
        <>
          {variant === 'google' && (
            <Ionicons name="logo-google" size={20} color="#4285F4" style={{ marginRight: 10 }} />
          )}
          <Text className={`text-[15px] tracking-wide ${fg[variant]}`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}