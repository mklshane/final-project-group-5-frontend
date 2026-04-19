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
    <View className="w-full mb-4">
      {label && (
        <Text className="text-text-secondary text-xs font-bold mb-1.5 ml-1 tracking-wider uppercase">{label}</Text>
      )}
      <View
        className={`flex-row items-center h-14 rounded-2xl bg-input-bg border-[1.5px] px-4 transition-colors ${
          error 
            ? 'border-budgy-red bg-budgy-red/5' 
            : isFocused 
              ? 'border-budgy-lime bg-surface' 
              : 'border-input-border'
        }`}
      >
        {leftIcon && <View className="mr-3 opacity-70">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-text text-base h-full font-medium"
          placeholderTextColor="#8E8E93" // iOS placeholder gray
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
        <Text className="text-budgy-red text-xs mt-1.5 ml-1 font-medium">{error}</Text>
      )}
    </View>
  );
}