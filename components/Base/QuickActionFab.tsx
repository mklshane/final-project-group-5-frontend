import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type QuickActionHandler = () => void | Promise<void>;

interface QuickActionFabProps {
  onQuickScan?: QuickActionHandler;
  onAddExpense?: QuickActionHandler;
  onAddIncome?: QuickActionHandler;
}

interface ActionItem {
  id: 'quick-scan' | 'add-expense' | 'add-income';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  handler?: QuickActionHandler;
}

export function QuickActionFab({ onQuickScan, onAddExpense, onAddIncome }: QuickActionFabProps) {
  const { colorScheme } = useColorScheme();
  const [open, setOpen] = useState(false);
  const iconAnim = useRef(new Animated.Value(0)).current;
  const isDark = colorScheme === 'dark';

  const palette = {
    fabBg: isDark ? '#C8F560' : '#1A1E14',
    fabIcon: isDark ? '#1A1E14' : '#C8F560',
    itemBg: isDark ? '#1A1E14' : '#FFFFFF',
    itemBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,30,20,0.10)',
    label: isDark ? '#EDF0E4' : '#1A1E14',
  };

  const actions = useMemo<ActionItem[]>(
    () => [
      {
        id: 'quick-scan',
        label: 'Quick scan',
        icon: 'scan-circle-outline',
        accentColor: '#E68A2E',
        handler: onQuickScan,
      },
      {
        id: 'add-expense',
        label: 'Add expense',
        icon: 'remove-circle-outline',
        accentColor: '#E35D5D',
        handler: onAddExpense,
      },
      {
        id: 'add-income',
        label: 'Add income',
        icon: 'add-circle-outline',
        accentColor: '#51A351',
        handler: onAddIncome,
      },
    ],
    [onQuickScan, onAddExpense, onAddIncome]
  );

  const iconStyle = {
    transform: [
      {
        rotate: iconAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '45deg'],
        }),
      },
      {
        scale: iconAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0.92, 1],
        }),
      },
    ],
  };

  const onToggle = async () => {
    await Haptics.selectionAsync();
    setOpen((prev) => {
      const next = !prev;
      Animated.spring(iconAnim, {
        toValue: next ? 1 : 0,
        stiffness: 280,
        damping: 18,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
      return next;
    });
  };

  const onActionPress = async (handler?: QuickActionHandler) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (handler) {
      await handler();
    }
    setOpen(false);
  };

  return (
    <View pointerEvents="box-none" style={s.root}>
      {open && (
        <View style={s.menuWrap}>
          {actions.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => {
                void onActionPress(action.handler);
              }}
              style={[s.menuItem, { backgroundColor: palette.itemBg, borderColor: palette.itemBorder }]}
            >
              <View style={[s.menuIconCircle, { backgroundColor: `${action.accentColor}22` }]}>
                <Ionicons name={action.icon} size={18} color={action.accentColor} />
              </View>
              <Text style={[s.menuLabel, { color: palette.label }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable onPress={() => void onToggle()} style={[s.fab, { backgroundColor: palette.fabBg }]}> 
        <Animated.View style={iconStyle}>
          <Ionicons name="add" size={30} color={palette.fabIcon} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    right: 24,
    bottom: 16,
    alignItems: 'flex-end',
    zIndex: 30,
  },
  menuWrap: {
    marginBottom: 12,
    gap: 10,
    alignItems: 'flex-end',
  },
  menuItem: {
    minWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(200,245,96,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 10,
  },
});
