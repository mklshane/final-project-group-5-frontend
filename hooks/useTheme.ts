import { useColorScheme } from 'nativewind';

export function useTheme() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    // Backgrounds
    bg:               isDark ? '#111410' : '#F4F5E9',
    surface:          isDark ? '#1A1E14' : '#FFFFFF',
    surfaceAlt:       isDark ? '#222618' : '#F8FAF2',
    surfaceDeep:      isDark ? '#2C3122' : '#EEF0E2',
    // Borders
    border:           isDark ? '#2C3122' : '#E4E6D6',
    borderHighlight:  isDark ? '#3A402D' : '#D1D4C2',
    // Text
    text:             isDark ? '#EDF0E4' : '#1A1E14',
    secondary:        isDark ? '#8A8F7C' : '#6B7060',
    tertiary:         isDark ? '#585D4C' : '#9DA28F',
    // Accent – brand
    lime:             '#C8F560',
    limeDark:         '#9BC23A',
    // Semantic
    green:            '#3DD97B',
    red:              '#FF6B6B',
    blue:             '#6BA3FF',
    purple:           '#B07BFF',
    orange:           '#FFAD5C',
    pink:             '#FF7EB3',
    // Overlays / backdrops
    backdrop:         'rgba(0,0,0,0.65)',
    overlayLight:     isDark ? 'rgba(0,0,0,0.64)' : 'rgba(26,30,20,0.45)',
    overlayModal:     isDark ? 'rgba(0,0,0,0.72)' : 'rgba(26,30,20,0.42)',
    // Keypad
    keypadBg:         isDark ? '#151810' : '#EEF0E2',
    keyBg:            isDark ? '#222618' : '#FFFFFF',
    keyBorder:        isDark ? '#333A28' : '#D9DDC8',
    keyDeleteBg:      isDark ? 'rgba(255,107,107,0.14)' : 'rgba(255,107,107,0.12)',
    // Inputs
    inputBg:          isDark ? '#111410' : '#F8F9F2',
    inputBorder:      isDark ? '#2F3527' : '#DDE1CF',
    inputPlaceholder: isDark ? '#66705D' : '#9DA28F',
    // Chips
    chipBg:           isDark ? '#222618' : '#EEF0E2',
    chipBorder:       isDark ? '#2C3122' : '#DDE1CF',
  } as const;
}

export type AppTheme = ReturnType<typeof useTheme>;
