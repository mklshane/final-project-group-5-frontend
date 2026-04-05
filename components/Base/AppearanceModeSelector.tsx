import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAppPreferences } from '@/context/AppPreferencesContext';

type ThemeMode = 'system' | 'light' | 'dark';

interface ModeOption {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPTIONS: ModeOption[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export function AppearanceModeSelector() {
  const { colorScheme } = useColorScheme();
  const { themeMode, setThemeMode } = useAppPreferences();
  const isDark = colorScheme === 'dark';

  const palette = {
    groupBg: isDark ? '#1A1E14' : '#FFFFFF',
    groupBorder: isDark ? '#2C3122' : '#E4E6D6',
    itemBg: isDark ? '#111410' : '#F4F5E9',
    activeBg: isDark ? 'rgba(200,245,96,0.12)' : '#EBF4D6',
    icon: isDark ? '#8A8F7C' : '#6B7060',
    activeIcon: '#8FAF2B',
    text: isDark ? '#8A8F7C' : '#6B7060',
    activeText: '#8FAF2B',
  };

  return (
    <View>
      <Text className="text-secondary text-[11px] font-extrabold tracking-[2px] mb-3">APPEARANCE</Text>

      <View
        className="rounded-3xl border p-2"
        style={{ backgroundColor: palette.groupBg, borderColor: palette.groupBorder }}
      >
        <View className="flex-row gap-2">
          {OPTIONS.map((option) => {
            const selected = themeMode === option.mode;

            return (
              <TouchableOpacity
                key={option.mode}
                activeOpacity={0.85}
                onPress={() => setThemeMode(option.mode)}
                className="flex-1 rounded-2xl items-center justify-center py-3.5 border"
                style={{
                  backgroundColor: selected ? palette.activeBg : palette.itemBg,
                  borderColor: selected ? '#9BC23A' : palette.groupBorder,
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selected ? palette.activeIcon : palette.icon}
                />
                <Text
                  className="mt-1.5 text-[15px] font-bold"
                  style={{ color: selected ? palette.activeText : palette.text }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
