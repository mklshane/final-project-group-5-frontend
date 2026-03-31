import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { ReactNode } from 'react';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
}

export function Input({ label, error, leftIcon, rightIcon, onRightIconPress, ...props }: InputProps) {
  return (
    <View className="w-full">
      {label && (
        <Text className="text-secondary text-sm font-medium mb-2">{label}</Text>
      )}
      <View
        className={`flex-row items-center h-14 rounded-2xl bg-card border px-4 ${
          error ? 'border-budgy-red' : 'border-card-deep'
        }`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-text text-base"
          placeholderTextColor="#9DA28F"
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} className="ml-3" activeOpacity={0.7}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-budgy-red text-xs mt-1.5 ml-1">{error}</Text>
      )}
    </View>
  );
}
