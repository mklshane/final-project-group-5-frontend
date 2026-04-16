import { View, Text, StyleSheet } from 'react-native';
import DonutChart from '@/components/Insights/DonutChart';
import { useTheme } from '@/hooks/useTheme';

type CategoryBreakdownData = {
  label: string;
  percentage: number;
  color: string;
};

type CategoryBreakdownProps = {
  data: CategoryBreakdownData[];
};

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const theme = useTheme();
  const s = makeStyles(theme);

  if (data.length === 0) {
    return (
      <View style={s.card}>
        <Text style={s.cardLabel}>WHERE YOUR MONEY GOES</Text>
        <Text style={s.emptyText}>No expense data for this period.</Text>
      </View>
    );
  }

  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>WHERE YOUR MONEY GOES</Text>
      <View style={s.donutRow}>
        <DonutChart
          data={data.map((c) => ({ label: c.label, percentage: c.percentage, color: c.color }))}
          size={130}
          strokeWidth={26}
        />
        <View style={s.legend}>
          {data.map((entry) => (
            <View key={entry.label} style={s.legendRow}>
              <View style={[s.legendDot, { backgroundColor: entry.color }]} />
              <Text style={s.legendLabel} numberOfLines={1}>{entry.label}</Text>
              <Text style={s.legendPct}>{entry.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  card: { backgroundColor: theme.surface, borderRadius: 20, padding: 16, gap: 12 },
  cardLabel: { fontSize: 9, fontWeight: '800', color: theme.secondary, letterSpacing: 1.4 },
  emptyText: { fontSize: 13, color: theme.secondary, fontWeight: '500' },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: theme.text },
  legendPct: { fontSize: 13, fontWeight: '700', color: theme.secondary },
});
