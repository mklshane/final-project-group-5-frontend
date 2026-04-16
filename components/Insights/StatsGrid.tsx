import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';

type Period = 'day' | 'week' | 'month' | 'year';

type StatsGridProps = {
  spentTotal: number;
  incomeTotal: number;
  netFlow: number;
  txCount: number;
  avgTx: number;
  spentDiff: number | null;
  incomeDiff: number | null;
  periodLabel: string;
};

export default function StatsGrid({
  spentTotal,
  incomeTotal,
  netFlow,
  txCount,
  avgTx,
  spentDiff,
  incomeDiff,
  periodLabel,
}: StatsGridProps) {
  const theme = useTheme();
  const finance = useFinanceSelectors();
  const s = makeStyles(theme);

  return (
    <View style={s.grid}>
      <View style={s.statCard}>
        <Text style={s.statLabel}>TOTAL SPENT</Text>
        <Text style={[s.statValue, { color: theme.red }]}>{finance.formatCurrency(spentTotal)}</Text>
        {spentDiff !== null ? (
          <View style={s.diffRow}>
            <Ionicons name={spentDiff >= 0 ? 'arrow-up' : 'arrow-down'} size={11} color={spentDiff >= 0 ? theme.red : theme.green} />
            <Text style={[s.diffText, { color: spentDiff >= 0 ? theme.red : theme.green }]}>
              {Math.abs(spentDiff)}% vs last {periodLabel}
            </Text>
          </View>
        ) : (
          <Text style={s.diffNeutral}>No prior data</Text>
        )}
      </View>

      <View style={s.statCard}>
        <Text style={s.statLabel}>TOTAL INCOME</Text>
        <Text style={[s.statValue, { color: theme.green }]}>{finance.formatCurrency(incomeTotal)}</Text>
        {incomeDiff !== null ? (
          <View style={s.diffRow}>
            <Ionicons name={incomeDiff >= 0 ? 'arrow-up' : 'arrow-down'} size={11} color={incomeDiff >= 0 ? theme.green : theme.red} />
            <Text style={[s.diffText, { color: incomeDiff >= 0 ? theme.green : theme.red }]}>
              {Math.abs(incomeDiff)}% vs last {periodLabel}
            </Text>
          </View>
        ) : (
          <Text style={s.diffNeutral}>Same as last mo</Text>
        )}
      </View>

      <View style={s.statCard}>
        <Text style={s.statLabel}>NET FLOW</Text>
        <Text style={[s.statValue, { color: netFlow >= 0 ? (theme.isDark ? theme.lime : '#3F7D36') : theme.red }]}>
          {netFlow >= 0 ? '+' : ''}{finance.formatCurrency(netFlow)}
        </Text>
        <View style={s.diffRow}>
          <Ionicons name={netFlow >= 0 ? 'trending-up' : 'trending-down'} size={11} color={netFlow >= 0 ? (theme.isDark ? theme.lime : '#3F7D36') : theme.red} />
          <Text style={[s.diffText, { color: netFlow >= 0 ? (theme.isDark ? theme.lime : '#3F7D36') : theme.red }]}>
            {netFlow >= 0 ? 'Saving well' : 'Overspending'}
          </Text>
        </View>
      </View>

      <View style={s.statCard}>
        <Text style={s.statLabel}>TRANSACTIONS</Text>
        <Text style={[s.statValue, { color: theme.text }]}>{txCount}</Text>
        <Text style={s.diffNeutral}>
          {txCount > 0 ? `Avg ${finance.formatCurrency(avgTx)} each` : 'No transactions'}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47.5%', backgroundColor: theme.surface, borderRadius: 18, padding: 14, gap: 3 },
  statLabel: { fontSize: 9, fontWeight: '800', color: theme.secondary, letterSpacing: 1.2 },
  statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  diffText: { fontSize: 11, fontWeight: '600' },
  diffNeutral: { fontSize: 11, fontWeight: '500', color: theme.secondary, marginTop: 1 },
});
