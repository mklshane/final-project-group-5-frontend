import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

type InsightsHeaderProps = {
  period: Period;
  onSetPeriod: (period: Period) => void;
};

export default function InsightsHeader({ period, onSetPeriod }: InsightsHeaderProps) {
  const theme = useTheme();
  const s = makeStyles(theme);

  return (
    <View style={s.wrapper}>
      <Text style={s.title}>Insights</Text>
      <Text style={s.groupLabel}>PERIOD</Text>
      <View style={s.tabRow}>
        {PERIOD_LABELS.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => onSetPeriod(key)}
            style={s.tabPressable}
          >
            {({ pressed }) => (
              <View style={[s.tab, period === key && s.tabActive, pressed && s.tabPressed]}>
                <Text style={[s.tabText, period === key && s.tabTextActive]}>{label}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  wrapper: {},
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.secondary,
    letterSpacing: 1.8,
    marginTop: 10,
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPressable: {
    flex: 1,
  },
  tab: {
    backgroundColor: theme.isDark ? theme.surfaceAlt : '#F7FAF3',
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0 : 0.04,
    shadowRadius: 4,
    elevation: theme.isDark ? 0 : 1,
  },
  tabActive: {
    backgroundColor: theme.lime,
    borderWidth: 1,
    borderColor: theme.limeDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0 : 0.08,
    shadowRadius: 3,
    elevation: theme.isDark ? 0 : 1,
  },
  tabPressed: {
    opacity: 0.86,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.secondary,
  },
  tabTextActive: {
    color: '#172319',
    fontWeight: '800',
  },
});
