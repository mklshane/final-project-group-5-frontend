import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import { useTheme } from '@/hooks/useTheme';

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
  const theme = useTheme();
  const { isDark } = theme;
  const { themeMode, setThemeMode } = useAppPreferences();

  const activeBg = isDark ? 'rgba(200,245,96,0.12)' : '#EBF4D6';
  const activeIcon = '#8FAF2B';
  const activeText = '#8FAF2B';

  return (
    <View>
      <Text className="text-secondary text-[11px] font-extrabold tracking-[2px] mb-3">APPEARANCE</Text>

      <View
        className="rounded-3xl border p-2"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
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
                  backgroundColor: selected ? activeBg : theme.surfaceDeep,
                  borderColor: selected ? '#9BC23A' : theme.border,
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selected ? activeIcon : theme.secondary}
                />
                <Text
                  className="mt-1.5 text-[15px] font-bold"
                  style={{ color: selected ? activeText : theme.secondary }}
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
