import { useState, ReactNode } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
}

export function Input({ label, error, leftIcon, rightIcon, onRightIconPress, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-full">
      {label && (
        <Text className="text-text text-sm font-semibold mb-2 ml-1 tracking-wide">{label}</Text>
      )}
      <View
        className={`flex-row items-center h-14 rounded-2xl bg-card border-[1.5px] px-4 transition-colors ${
          error 
            ? 'border-budgy-red bg-budgy-red/5' 
            : isFocused 
              ? 'border-dark bg-bg' 
              : 'border-card-deep'
        }`}
      >
        {leftIcon && <View className="mr-3 opacity-70">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-text text-base h-full font-medium"
          placeholderTextColor="#9DA28F"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} className="ml-3 p-1" activeOpacity={0.7}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-budgy-red text-xs mt-2 ml-1 font-medium">{error}</Text>
      )}
    </View>
  );
}