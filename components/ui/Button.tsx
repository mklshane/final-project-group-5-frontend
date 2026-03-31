import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
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
  primary: 'bg-budgy-lime active:bg-budgy-lime-dark',
  outline: 'bg-transparent border border-secondary',
  google: 'bg-card border border-card-deep',
};

const fg: Record<Variant, string> = {
  primary: 'text-dark font-semibold',
  outline: 'text-text font-medium',
  google: 'text-text font-medium',
};

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center h-14 rounded-2xl px-6 ${bg[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#1A1E14' : '#C8F560'} size="small" />
      ) : (
        <>
          {variant === 'google' && (
            <Ionicons name="logo-google" size={20} color="#4285F4" style={{ marginRight: 8 }} />
          )}
          <Text className={`text-base ${fg[variant]}`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
