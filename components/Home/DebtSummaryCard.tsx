import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { DebtRecord } from '@/types/finance';

interface DebtSummaryCardProps {
  entry: DebtRecord;
  formatCurrency: (amount: number) => string;
  onPress?: () => void;
}

export function DebtSummaryCard({ entry, formatCurrency, onPress }: DebtSummaryCardProps) {
  const theme = useTheme();

  const total = Number.isFinite(entry.total_amount) ? entry.total_amount : entry.amount ?? 0;
  const paid = Number.isFinite(entry.amount_paid) ? entry.amount_paid : 0;
  const remaining = Math.max(0, total - paid);
  const progress = total > 0 ? Math.min(1, paid / total) : 0;

  const isOwe = entry.type === 'owe';
  const accentColor = isOwe ? theme.red : (theme.isDark ? theme.green : '#3F7D36');

  const name = entry.counterparty_name ?? entry.person_name ?? 'Unknown';
  const typeLabel = isOwe ? 'Payable' : 'Receivable';
  const dueText = entry.due_date
    ? new Date(entry.due_date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const progressBarFill = remaining === 0 ? theme.green : accentColor;

  return (
    <Pressable
      style={({ pressed }) => pressed && { opacity: 0.75 }}
      onPress={onPress}
    >
      <View style={[s.card, { backgroundColor: theme.isDark ? theme.surfaceDeep : theme.surface, borderColor: theme.border }]}>
      <View style={s.topRow}>
        <View style={s.info}>
          <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>
            {name}
          </Text>
          <View style={s.metaRow}>
            <View style={[s.typePill, { backgroundColor: `${accentColor}20` }]}>
              <Text style={[s.typeLabel, { color: accentColor }]}>{typeLabel}</Text>
            </View>
            {dueText ? (
              <>
                <Text style={[s.dot, { color: theme.tertiary }]}> · </Text>
                <Ionicons name="time-outline" size={11} color={theme.tertiary} style={s.clockIcon} />
                <Text style={[s.dueText, { color: theme.tertiary }]}>{dueText}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={s.amountBlock}>
          <Text style={[s.amount, { color: remaining > 0 ? theme.text : theme.green }]}>
            {formatCurrency(remaining)}
          </Text>
          <Text style={[s.amountSub, { color: theme.tertiary }]}>
            of {formatCurrency(total)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[s.progressTrack, { backgroundColor: `${accentColor}20` }]}>
        <View
          style={[
            s.progressFill,
            { backgroundColor: `${progressBarFill}A6`, width: `${Math.round(progress * 100)}%` },
          ]}
        />
      </View>
      <View style={s.progressLabelRow}>
        <Text style={[s.progressLabel, { color: theme.tertiary }]}>
          {formatCurrency(paid)} paid
        </Text>
        <Text style={[s.progressLabel, { color: theme.tertiary }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typePill: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  amountBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  amountSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  progressTrack: {
    height: 5,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
