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
    <View>
      <Text style={s.title}>Insights</Text>
      <View style={s.tabRow}>
        {PERIOD_LABELS.map(({ key, label }) => (
          <Pressable key={key} onPress={() => onSetPeriod(key)} style={[s.tab, period === key && s.tabActive]}>
            <Text style={[s.tabText, period === key && s.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.8,
    marginTop: 4,
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.lime,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.secondary,
  },
  tabTextActive: {
    color: '#1A1E14',
    fontWeight: '700',
  },
});
