import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { GoalContributionModal } from '@/components/Profile/GoalContributionModal';

const toDateLabel = (value: string) => {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function GoalDetailScreen() {
  const theme = useTheme();
  const { state, updateGoal, addTransaction } = useFinanceData();
  const finance = useFinanceSelectors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const [contributionVisible, setContributionVisible] = useState(false);

  const goalId = useMemo(() => {
    if (!params.id) return '';
    return Array.isArray(params.id) ? params.id[0] ?? '' : params.id;
  }, [params.id]);

  const goal = useMemo(
    () => state.goals.find((entry) => !entry.deleted_at && entry.id === goalId) ?? null,
    [state.goals, goalId]
  );

  if (!goal) {
    return (
      <>
        <Stack.Screen options={{ title: 'Goal Details' }} />
        <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
          <View style={s.emptyWrap}>
            <Text style={[s.emptyTitle, { color: theme.text }]}>Goal not found</Text>
            <Text style={[s.emptyBody, { color: theme.secondary }]}>This goal may have been deleted or moved.</Text>
            <Pressable
              onPress={() => router.back()}
              style={[s.backButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
            >
              <Text style={[s.backLabel, { color: theme.text }]}>Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const targetAmount = Math.max(0, Number(goal.target_amount) || 0);
  const savedAmount = Math.max(0, Number(goal.saved_amount) || 0);
  const remainingAmount = Math.max(0, targetAmount - savedAmount);
  const progress = targetAmount > 0 ? Math.max(0, Math.min(100, Math.round((savedAmount / targetAmount) * 100))) : 0;
  const isCompleted = remainingAmount <= 0;
  const accentColor = theme.isDark ? theme.lime : '#3F7D36';
  const accentBg = theme.isDark ? 'rgba(200,245,96,0.10)' : 'rgba(63,125,54,0.10)';
  const statusLabel = isCompleted ? 'Completed' : 'Active';
  const activeWallets = state.wallets.filter((wallet) => !wallet.deleted_at);
  const fixedGoalCategory =
    state.categories.find((category) => {
      if (category.deleted_at) return false;
      const normalized = category.name.trim().toLowerCase();
      return normalized === 'miscellaneous';
    }) ?? state.categories.find((category) => !category.deleted_at && (category.type === 'expense' || category.type === 'both')) ?? null;

  const goalMarker = `[#goal:${goal.id}]`;
  const contributionTransactions = state.transactions
    .filter((transaction) => !transaction.deleted_at && transaction.note?.includes(goalMarker))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const saveContribution = async (input: {
    amount: number;
    date: string;
    walletId: string | null;
    note: string;
  }) => {
    const amount = Math.max(0, input.amount);
    if (amount <= 0 || remainingAmount <= 0) return;

    const nextSaved = Math.min(targetAmount, savedAmount + amount);
    const linkedNote = input.note
      ? `${input.note} ${goalMarker}`
      : goalMarker;

    await Promise.all([
      updateGoal({
        id: goal.id,
        title: goal.title,
        targetAmount,
        savedAmount: nextSaved,
        deadline: goal.deadline ?? null,
      }),
      addTransaction({
        title: `Goal Contribution - ${goal.title}`,
        amount,
        type: 'expense',
        walletId: input.walletId,
        categoryId: fixedGoalCategory?.id ?? null,
        date: input.date,
        note: linkedNote,
      }),
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: goal.title || 'Goal Details' }} />
      <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.pillRow}>
            <View style={[s.directionPill, { backgroundColor: accentBg }]}>
              <Ionicons name="flag-outline" size={13} color={accentColor} />
              <Text style={[s.directionPillText, { color: accentColor }]}>Saving for {goal.title}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: isCompleted ? 'rgba(61,217,123,0.12)' : theme.surfaceDeep }]}>
              <Text style={[s.statusPillText, { color: isCompleted ? theme.green : theme.secondary }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={[s.balanceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.balanceLabel, { color: theme.secondary }]}>REMAINING</Text>
            <Text style={[s.balanceAmount, { color: theme.text }]}>{finance.formatCurrency(remainingAmount)}</Text>

            <View style={[s.divider, { backgroundColor: theme.border }]} />

            <View style={s.balanceRow}>
              <Text style={[s.balanceMeta, { color: theme.secondary }]}>Saved</Text>
              <Text style={[s.balanceMetaValue, { color: theme.text }]}>{finance.formatCurrency(savedAmount)}</Text>
            </View>
            <View style={s.balanceRow}>
              <Text style={[s.balanceMeta, { color: theme.secondary }]}>Target</Text>
              <Text style={[s.balanceMetaValue, { color: theme.text }]}>{finance.formatCurrency(targetAmount)}</Text>
            </View>

            {targetAmount > 0 ? (
              <View style={s.progressSection}>
                <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}>
                  <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
                </View>
                <Text style={[s.progressLabel, { color: theme.tertiary }]}>{progress}% funded</Text>
              </View>
            ) : null}
          </View>

          <View style={[s.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[s.infoRow, { borderBottomColor: theme.border }]}>
              <View style={s.infoLeft}>
                <Ionicons name="calendar-outline" size={15} color={theme.tertiary} />
                <Text style={[s.infoKey, { color: theme.secondary }]}>Deadline</Text>
              </View>
              <Text style={[s.infoValue, { color: theme.text }]}>
                {goal.deadline ? toDateLabel(goal.deadline) : 'No target date'}
              </Text>
            </View>

            <View style={s.infoRowLast}>
              <View style={s.infoLeft}>
                <Ionicons name="analytics-outline" size={15} color={theme.tertiary} />
                <Text style={[s.infoKey, { color: theme.secondary }]}>Progress</Text>
              </View>
              <Text style={[s.infoValue, { color: theme.text }]}>
                {progress}% complete
              </Text>
            </View>
          </View>

          {contributionTransactions.length > 0 ? (
            <View style={[s.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.historySectionLabel, { color: theme.secondary }]}>CONTRIBUTION HISTORY</Text>
              {contributionTransactions.map((transaction, index) => {
                const wallet = state.wallets.find((entry) => entry.id === transaction.wallet_id);
                const category = state.categories.find((entry) => entry.id === transaction.category_id);
                const isLast = index === contributionTransactions.length - 1;
                return (
                  <View
                    key={transaction.id}
                    style={[
                      s.historyRow,
                      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                    ]}
                  >
                    <View style={s.historyLeft}>
                      <Text style={[s.historyDate, { color: theme.text }]}>{toDateLabel(transaction.date)}</Text>
                      <Text style={[s.historyMeta, { color: theme.tertiary }]}>
                        {wallet?.name ?? 'Wallet'}
                        {category ? ` · ${category.name}` : ''}
                      </Text>
                    </View>
                    <Text style={[s.historyAmount, { color: accentColor }]}>{finance.formatCurrency(transaction.amount)}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>

        <View style={[s.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <Pressable
            onPress={() => setContributionVisible(true)}
            disabled={isCompleted}
            style={[
              s.logButton,
              {
                backgroundColor: isCompleted ? theme.surfaceDeep : (theme.isDark ? theme.lime : '#3F7D36'),
                borderColor: isCompleted ? theme.border : (theme.isDark ? theme.lime : '#3F7D36'),
              },
            ]}
          >
            <Ionicons name="cash-outline" size={16} color={isCompleted ? theme.tertiary : (theme.isDark ? theme.bg : '#FFFFFF')} />
            <Text style={[s.logButtonText, { color: isCompleted ? theme.tertiary : (theme.isDark ? theme.bg : '#FFFFFF') }]}>Log Contribution</Text>
          </Pressable>
        </View>

        <GoalContributionModal
          visible={contributionVisible}
          goalTitle={goal.title}
          maxAmount={remainingAmount}
          wallets={activeWallets}
          onClose={() => setContributionVisible(false)}
          onSave={saveContribution}
        />
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  directionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 1,
  },
  directionPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  statusPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  balanceMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  balanceMetaValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoKey: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  historySectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyLeft: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  logButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    height: 42,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
