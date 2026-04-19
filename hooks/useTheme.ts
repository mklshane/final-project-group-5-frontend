import { useColorScheme } from 'nativewind';

export function useTheme() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    // Backgrounds
    bg:               isDark ? '#0F1713' : '#F0F1F0',
    surface:          isDark ? '#16221B' : '#FFFFFF',
    surfaceAlt:       isDark ? '#1E2B23' : '#F7F9F2',
    surfaceDeep:      isDark ? '#27382E' : '#EEF1E8',
    // Borders
    border:           isDark ? '#2F4035' : '#DCE2D5',
    borderHighlight:  isDark ? '#3B4E42' : '#C9D1C3',
    // Text
    text:             isDark ? '#E9EFE4' : '#1A2B23',
    secondary:        isDark ? '#99A99C' : '#637166',
    tertiary:         isDark ? '#738174' : '#8E9A90',
    // Accent – brand
    lime:             '#C8F560',
    limeDark:         '#8AAF2D',
    // Semantic
    green:            '#48B86C',
    red:              '#E66C6A',
    blue:             '#5D9CEB',
    purple:           '#9B7BE8',
    orange:           '#F59E0B',
    pink:             '#EC4899',
    // Overlays / backdrops
    backdrop:         'rgba(0,0,0,0.65)',
    overlayLight:     isDark ? 'rgba(0,0,0,0.64)' : 'rgba(26,43,35,0.45)',
    overlayModal:     isDark ? 'rgba(0,0,0,0.72)' : 'rgba(26,43,35,0.42)',
    // Keypad
    keypadBg:         isDark ? '#121C17' : '#EEF1E8',
    keyBg:            isDark ? '#1E2B23' : '#FFFFFF',
    keyBorder:        isDark ? '#34463B' : '#D5DEC9',
    keyDeleteBg:      isDark ? 'rgba(230,108,106,0.16)' : 'rgba(230,108,106,0.10)',
    // Inputs
    inputBg:          isDark ? '#121C17' : '#F8FAF3',
    inputBorder:      isDark ? '#34463B' : '#D5DEC9',
    inputPlaceholder: isDark ? '#738174' : '#8E9A90',
    // Chips
    chipBg:           isDark ? '#1E2B23' : '#EEF1E8',
    chipBorder:       isDark ? '#2F4035' : '#D5DEC9',
  } as const;
}

export type AppTheme = ReturnType<typeof useTheme>;
