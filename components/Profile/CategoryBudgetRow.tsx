import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { BudgetRecord, CategoryRecord } from '@/types/finance';

interface CategoryBudgetRowProps {
  category: CategoryRecord;
  budget: BudgetRecord | null;
  spent: number;
  periodLabel: string;
  formatCurrency: (amount: number) => string;
  onPressBudget: (category: CategoryRecord) => void;
}

export function CategoryBudgetRow({
  category,
  budget,
  spent,
  periodLabel,
  formatCurrency,
  onPressBudget,
}: CategoryBudgetRowProps) {
  const theme = useTheme();
  const { isDark } = theme;

  const iconName =
    category.icon && Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, category.icon)
      ? (category.icon as keyof typeof Ionicons.glyphMap)
      : 'apps-outline';

  const iconBg = `${category.color ?? '#6C757D'}1F`;
  const iconColor = category.color ?? (isDark ? '#C8F560' : '#1A1E14');

  const limit = budget?.amount_limit ?? 0;
  const progress = limit > 0 ? Math.min(1, spent / limit) : 0;
  const progressPercent = Math.round(progress * 100);
  const overLimit = limit > 0 && spent > limit;
  const nearLimit = !overLimit && progressPercent >= 80;
  const remainingAmount = Math.max(0, limit - spent);

  const statusLabel = overLimit ? 'Over Limit' : nearLimit ? 'Near Limit' : 'On Track';
  const statusColor = overLimit ? theme.red : nearLimit ? theme.orange : theme.green;
  const statusBg = overLimit
    ? (isDark ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.12)')
    : nearLimit
      ? (isDark ? 'rgba(255,173,92,0.16)' : 'rgba(255,173,92,0.12)')
      : (isDark ? 'rgba(61,217,123,0.18)' : 'rgba(61,217,123,0.12)');

  return (
    <View style={[s.row, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
      <View style={s.topRow}>
        <View style={s.headerLeft}>
          <View style={[s.iconWrap, { backgroundColor: iconBg, borderColor: theme.borderHighlight }]}> 
            <Ionicons name={iconName} size={18} color={iconColor} />
          </View>

          <View style={s.titleWrap}>
            <Text style={[s.categoryName, { color: theme.text }]} numberOfLines={1}>
              {category.name}
            </Text>
            <View style={s.metaRow}>
              {budget ? (
                <View style={[s.metaChip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                  <Text style={[s.metaChipText, { color: theme.secondary }]}>{periodLabel}</Text>
                </View>
              ) : null}
              {budget ? (
                <View style={[s.metaChip, { backgroundColor: statusBg, borderColor: statusColor }]}> 
                  <Text style={[s.metaChipText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => onPressBudget(category)}
          style={[s.budgetButton, { backgroundColor: isDark ? theme.lime : '#2F6E2A' }]}
        >
          <Ionicons name={budget ? 'create-outline' : 'add-outline'} size={14} color={isDark ? theme.bg : '#FFFFFF'} />
          <Text style={[s.budgetButtonText, { color: isDark ? theme.bg : '#FFFFFF' }]}> 
            {budget ? 'Edit' : 'Budget'}
          </Text>
        </Pressable>
      </View>

      {budget ? (
        <View style={[s.progressPanel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
          <View style={s.statsRow}>
            <View style={s.statCol}>
              <Text style={[s.statLabel, { color: theme.secondary }]}>SPENT</Text>
              <Text style={[s.statValue, { color: overLimit ? theme.red : theme.text }]}>{formatCurrency(spent)}</Text>
            </View>
            <View style={s.statCol}>
              <Text style={[s.statLabel, { color: theme.secondary }]}>LIMIT</Text>
              <Text style={[s.statValue, { color: theme.text }]}>{formatCurrency(limit)}</Text>
            </View>
            <View style={s.statCol}>
              <Text style={[s.statLabel, { color: theme.secondary }]}>{overLimit ? 'OVER' : 'LEFT'}</Text>
              <Text style={[s.statValue, { color: overLimit ? theme.red : theme.text }]}> 
                {formatCurrency(overLimit ? spent - limit : remainingAmount)}
              </Text>
            </View>
          </View>

          <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}> 
            <View
              style={[
                s.progressFill,
                {
                  width: `${Math.min(progress, 1) * 100}%`,
                  backgroundColor: overLimit ? theme.red : theme.lime,
                },
              ]}
            />
          </View>

          <View style={s.footerRow}>
            <Text style={[s.statusText, { color: overLimit ? theme.red : theme.secondary }]} numberOfLines={1}>
              {overLimit
                ? `Over by ${formatCurrency(spent - limit)}`
                : `${formatCurrency(remainingAmount)} remaining`}
            </Text>
            <Text style={[s.progressText, { color: theme.text }]}>{progressPercent}%</Text>
          </View>
        </View>
      ) : (
        <View style={[s.emptyBudget, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
          <View style={s.emptyRow}>
            <Ionicons name="sparkles-outline" size={14} color={theme.tertiary} />
            <Text style={[s.emptyText, { color: theme.secondary }]}>No active budget</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  budgetButton: {
    borderRadius: 999,
    minWidth: 74,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 4,
  },
  budgetButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  progressPanel: {
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
    gap: 8,
  },
  statCol: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
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
    letterSpacing: -0.2,
  },
  amountSecondary: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  footerRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBudget: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 11,
    marginTop: 10,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
