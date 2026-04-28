import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useToast } from '@/context/ToastContext';
import { GoalEditorModal } from '@/components/Profile/GoalEditorModal';
import { GoalContributionModal } from '@/components/Profile/GoalContributionModal';

const toDateLabel = (value: string) => {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const toTimeLabel = (value: string | null | undefined) => {
  if (!value) return '--:--';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return '--:--';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return '--:--';
  return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const toDaysLabel = (value: string | null | undefined) => {
  if (!value) return 'No target date';
  const parsed = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(parsed.getTime())) return 'No target date';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.ceil((parsed.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} to go`;
  if (diffDays === 0) return 'Due today';
  const overdueDays = Math.abs(diffDays);
  return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
};

export default function GoalDetailScreen() {
  const theme = useTheme();
  const { state, updateGoal, deleteGoal, addTransaction } = useFinanceData();
  const finance = useFinanceSelectors();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const [contributionVisible, setContributionVisible] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);

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
  const timelineLabel = toDaysLabel(goal.deadline);
  const subtitleLabel = goal.deadline ? `Target ${toDateLabel(goal.deadline)}` : 'No target date';
  const logButtonColor = theme.isDark ? theme.lime : '#3F7D36';
  const logButtonLabelColor = theme.isDark ? theme.bg : '#FFFFFF';
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

    try {
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
      toast.show('Contribution saved', 'success');
    } catch {
      toast.show('Failed to save contribution', 'error');
    }
  };

  const saveGoalEdits = async (input: {
    title: string;
    targetAmount: number;
    savedAmount: number;
    deadline?: string | null;
  }) => {
    try {
      await updateGoal({
        id: goal.id,
        title: input.title,
        targetAmount: input.targetAmount,
        savedAmount: input.savedAmount,
        deadline: input.deadline,
      });
      toast.show('Goal updated', 'success');
    } catch {
      toast.show('Failed to update goal', 'error');
    }
  };

  const confirmDeleteGoal = async () => {
    try {
      await deleteGoal(goal.id);
      router.back();
    } catch {
      toast.show('Failed to delete goal', 'error');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: goal.title || 'Goal Details' }} />
      <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={[s.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <View style={s.heroHeaderRow}>
              <View style={s.heroTextBlock}>
                <Text style={[s.heroTitle, { color: theme.text }]} numberOfLines={1}>{goal.title}</Text>
                <Text style={[s.heroSubtitle, { color: theme.secondary }]} numberOfLines={1}>{subtitleLabel}</Text>
              </View>

              <View style={s.heroHeaderRight}>
                <View style={[s.changePill, { backgroundColor: accentBg }]}> 
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : 'arrow-up-circle'}
                    size={13}
                    color={accentColor}
                  />
                  <Text style={[s.changePillText, { color: accentColor }]}>{progress}%</Text>
                </View>
                <Text style={[s.changeCaption, { color: theme.secondary }]}>Progress to target</Text>
              </View>
            </View>

            <View style={s.metaRow}>
              <View style={[s.statusPill, { backgroundColor: isCompleted ? 'rgba(61,217,123,0.12)' : theme.surfaceDeep }]}> 
                <Text style={[s.statusPillText, { color: isCompleted ? theme.green : theme.secondary }]}>{statusLabel}</Text>
              </View>
            </View>

            <View style={[s.progressOverviewCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
              <View style={s.progressAmountRow}>
                <Text style={[s.progressPrimaryAmount, { color: remainingAmount > 0 ? theme.text : theme.lime }]}> 
                  {finance.formatCurrency(savedAmount)}
                </Text>
                <Text style={[s.progressSecondaryAmount, { color: theme.secondary }]}> 
                  {finance.formatCurrency(targetAmount)}
                </Text>
              </View>

              <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}> 
                <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
              </View>

              <View style={s.progressFooterRow}>
                <Text style={[s.progressFooterText, { color: theme.secondary }]}>{timelineLabel}</Text>
                <Text style={[s.progressFooterPercent, { color: theme.text }]}>{progress}%</Text>
              </View>
            </View>
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
              <Text style={[s.historySectionLabel, { color: theme.secondary }]}>TRANSACTIONS</Text>
              {contributionTransactions.map((transaction, index) => {
                const isLast = index === contributionTransactions.length - 1;
                const transactionTime = toTimeLabel(transaction.created_at ?? transaction.updated_at ?? null);
                return (
                  <View
                    key={transaction.id}
                    style={[
                      s.historyRow,
                      {
                        backgroundColor: theme.surfaceAlt,
                        borderColor: theme.border,
                      },
                      !isLast && s.historyRowGap,
                    ]}
                  >
                    <View style={s.historyLeft}>
                      <Text style={[s.historyDate, { color: theme.text }]}>{toDateLabel(transaction.date)}</Text>
                      <Text style={[s.historyMeta, { color: theme.tertiary }]}>{transactionTime}</Text>
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
            onPress={() => setEditorVisible(true)}
            style={[s.footerActionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={18} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert(
              'Delete goal?',
              `Delete "${goal.title}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => void confirmDeleteGoal() },
              ],
            )}
            style={[s.footerActionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={theme.red} />
          </Pressable>

          <Pressable
            onPress={() => setContributionVisible(true)}
            disabled={isCompleted}
            style={[
              s.logButton,
              {
                backgroundColor: logButtonColor,
                borderColor: logButtonColor,
                opacity: isCompleted ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="cash-outline" size={16} color={logButtonLabelColor} />
            <Text style={[s.logButtonText, { color: logButtonLabelColor }]}>Log Contribution</Text>
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

        <GoalEditorModal
          visible={editorVisible}
          initialGoal={goal}
          onClose={() => setEditorVisible(false)}
          onSave={saveGoalEdits}
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
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  heroHeaderRight: {
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changePillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  changeCaption: {
    fontSize: 11,
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  progressOverviewCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  progressAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressPrimaryAmount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  progressSecondaryAmount: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  progressFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressFooterText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  progressFooterPercent: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
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
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
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
    overflow: 'visible',
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  historySectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  historyRowGap: {
    marginBottom: 8,
  },
  historyLeft: {
    flex: 1,
    gap: 4,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButton: {
    flex: 1,
    height: 48,
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
