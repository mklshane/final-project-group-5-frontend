import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { DebtRecord } from '@/types/finance';

interface DebtSummaryCardProps {
  entry: DebtRecord;
  formatCurrency: (amount: number) => string;
}

export function DebtSummaryCard({ entry, formatCurrency }: DebtSummaryCardProps) {
  const theme = useTheme();

  const total = Number.isFinite(entry.total_amount) ? entry.total_amount : entry.amount ?? 0;
  const paid = Number.isFinite(entry.amount_paid) ? entry.amount_paid : 0;
  const remaining = Math.max(0, total - paid);

  const isOwe = entry.type === 'owe';
  const accentColor = isOwe ? theme.red : theme.blue;

  const name = entry.counterparty_name ?? entry.person_name ?? 'Unknown';
  const typeLabel = isOwe ? 'Payable' : 'Receivable';
  const dueText = entry.due_date
    ? new Date(entry.due_date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={s.info}>
        <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={s.metaRow}>
          <Text style={[s.typeLabel, { color: accentColor }]}>{typeLabel}</Text>
          {dueText ? (
            <>
              <Text style={[s.dot, { color: theme.tertiary }]}> · </Text>
              <Ionicons name="time-outline" size={11} color={theme.tertiary} style={s.clockIcon} />
              <Text style={[s.dueText, { color: theme.tertiary }]}>{dueText}</Text>
            </>
          ) : null}
        </View>
      </View>

      <Text style={[s.amount, { color: remaining > 0 ? theme.text : theme.green }]}>
        {formatCurrency(remaining)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  dot: {
    fontSize: 11,
  },
  clockIcon: {
    marginRight: 2,
  },
  dueText: {
    fontSize: 11,
    fontWeight: '500',
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.4,
    flexShrink: 0,
  },
});
