import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export type ToastType = 'success' | 'error' | 'info';

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const translateY = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [translateY]);

  const show = useCallback(
    (msg: string, toastType: ToastType = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage(msg);
      setType(toastType);
      setVisible(true);
      translateY.setValue(-120);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 20,
        stiffness: 260,
        useNativeDriver: true,
      }).start();
      timerRef.current = setTimeout(hide, 3000);
    },
    [translateY, hide],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const bgColor =
    type === 'success'
      ? theme.isDark
        ? 'rgba(200,245,96,0.13)'
        : 'rgba(63,125,54,0.08)'
      : type === 'error'
        ? theme.isDark
          ? 'rgba(230,108,106,0.13)'
          : 'rgba(230,108,106,0.08)'
        : theme.isDark
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(0,0,0,0.04)';

  const borderColor =
    type === 'success'
      ? theme.isDark
        ? 'rgba(200,245,96,0.30)'
        : 'rgba(63,125,54,0.22)'
      : type === 'error'
        ? 'rgba(230,108,106,0.36)'
        : theme.border;

  const iconName: keyof typeof Ionicons.glyphMap =
    type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle';

  const iconColor =
    type === 'success'
      ? theme.isDark
        ? theme.lime
        : theme.limeDark
      : type === 'error'
        ? theme.red
        : theme.secondary;

  const textColor =
    type === 'success'
      ? theme.isDark
        ? theme.lime
        : theme.limeDark
      : type === 'error'
        ? theme.red
        : theme.text;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            s.banner,
            {
              top: insets.top + 10,
              backgroundColor: theme.surface,
              borderColor,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[s.inner, { backgroundColor: bgColor }]}>
            <Ionicons name={iconName} size={18} color={iconColor} />
            <Text style={[s.text, { color: textColor }]} numberOfLines={2}>
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
});
