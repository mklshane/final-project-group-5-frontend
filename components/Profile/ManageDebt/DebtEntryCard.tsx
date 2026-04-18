import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { DebtRecord } from '@/types/finance';

interface DebtEntryCardProps {
  debt: DebtRecord;
  formatCurrency: (amount: number) => string;
  onPressDetails: (debt: DebtRecord) => void;
}

const debtAmounts = (debt: DebtRecord) => {
  const total = Number.isFinite(debt.total_amount) ? debt.total_amount : debt.amount ?? 0;
  const paid = Number.isFinite(debt.amount_paid) ? debt.amount_paid : 0;
  const remaining = Math.max(0, total - paid);
  return { total, paid, remaining };
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatDebtTimeline = (dueDate: string | null | undefined) => {
  if (!dueDate) return 'No due date';
  const due = new Date(`${dueDate}T00:00:00`);
  if (!Number.isFinite(due.getTime())) return 'No due date';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.ceil((due.getTime() - startOfToday.getTime()) / MS_PER_DAY);

  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} to go`;
  if (diffDays === 0) return 'Due today';
  const overdueDays = Math.abs(diffDays);
  return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
};

export function DebtEntryCard({ debt, formatCurrency, onPressDetails }: DebtEntryCardProps) {
  const theme = useTheme();

  const { total, paid, remaining } = debtAmounts(debt);
  const progress = total > 0 ? Math.min(1, paid / total) : 0;
  const counterpartyName = debt.counterparty_name ?? debt.person_name ?? 'Unknown';
  const timelineText = formatDebtTimeline(debt.due_date);

  return (
    <Pressable
      onPress={() => {
        onPressDetails(debt);
      }}
      style={({ pressed }) => pressed && s.cardPressed}
    >
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <View style={[s.iconWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
              <Ionicons name="arrow-up-outline" size={18} color={theme.orange} />
            </View>
            <View style={s.headerText}>
              <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>
                {counterpartyName}
              </Text>
              <Text style={[s.subtitle, { color: theme.secondary }]} numberOfLines={1}>
                You owe
              </Text>
            </View>
          </View>

          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onPressDetails(debt);
            }}
            style={[s.chevronBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.tertiary} />
          </Pressable>
        </View>

        <View style={[s.progressPanel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
          <View style={s.amountRow}>
            <Text style={[s.amountPrimary, { color: remaining > 0 ? theme.text : theme.green }]}>
              {formatCurrency(paid)}
            </Text>
            <Text style={[s.amountSecondary, { color: theme.secondary }]}>
              {formatCurrency(total)}
            </Text>
          </View>

          <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}> 
            <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.red }]} />
          </View>

          <View style={s.footerRow}>
            <Text style={[s.timelineText, { color: theme.secondary }]} numberOfLines={1}>
              {timelineText}
            </Text>
            <Text style={[s.progressPercent, { color: theme.text }]}> 
              {Math.round(progress * 100)}%
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
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  chevronBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPanel: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountPrimary: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  amountSecondary: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timelineText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});