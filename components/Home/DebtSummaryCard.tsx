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
  const accentBg = isOwe ? 'rgba(255, 107, 107, 0.08)' : 'rgba(61, 217, 123, 0.08)';

  const name = entry.counterparty_name ?? entry.person_name ?? 'Unknown';
  const typeLabel = isOwe ? 'Payable' : 'Receivable';
  const dueText = entry.due_date
    ? new Date(entry.due_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <Pressable
      style={({ pressed }) => pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }}
      onPress={onPress}
    >
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={s.topRow}>
          <View style={[s.iconWrap, { backgroundColor: accentBg }]}>
            <Ionicons name={isOwe ? 'arrow-up' : 'arrow-down'} size={18} color={accentColor} />
          </View>

          <View style={s.info}>
            <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>
              {name}
            </Text>
            <View style={s.metaRow}>
              <Text style={[s.typeLabel, { color: accentColor }]}>{typeLabel}</Text>
              {dueText ? (
                <>
                  <Text style={[s.dot, { color: theme.tertiary }]}> • </Text>
                  <Text style={[s.dueText, { color: theme.tertiary }]}>Due {dueText}</Text>
                </>
              ) : null}
            </View>
          </View>

          <View style={s.amountBlock}>
            <Text style={[s.amount, { color: theme.text }]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={s.progressContainer}>
          <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}>
            <View
              style={[
                s.progressFill,
                { backgroundColor: accentColor, width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          <View style={s.progressLabelRow}>
            <Text style={[s.progressLabel, { color: theme.tertiary }]}>
              {formatCurrency(paid)} paid
            </Text>
            <Text style={[s.progressLabel, { color: theme.tertiary }]}>
              of {formatCurrency(total)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dot: {
    fontSize: 10,
    marginHorizontal: 2,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  progressContainer: {
    width: '100%',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});