import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { QuickActionFab } from '@/components/Base/QuickActionFab';
import { TransactionCard } from '@/components/Base/TransactionCard';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { TransactionEntryModal } from '@/components/Base/TransactionEntryModal';
import { DebtSummaryCard } from '@/components/Home/DebtSummaryCard';
import { GoalSummaryCard } from '@/components/Home/GoalSummaryCard';
import { BudgetSummaryCard } from '@/components/Home/BudgetSummaryCard';
import { AccountsSection } from '../../../components/Home/AccountsSection';
import type { CategoryRecord } from '@/types/finance';

type HomeSectionKey = 'accounts' | 'goals' | 'debt' | 'recent' | 'budget';

const DEFAULT_HOME_SECTION_ORDER: HomeSectionKey[] = ['accounts', 'goals', 'debt', 'recent', 'budget'];

const HOME_SECTION_LABELS: Record<HomeSectionKey, string> = {
  accounts: 'Accounts',
  goals: 'Goals',
  debt: 'Debt',
  recent: 'Recent Activity',
  budget: 'Budgets',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const { isDark } = theme;
  const { profile } = useAuth();
  const { state, addTransaction, deleteTransaction, error: financeError } = useFinanceData();
  const finance = useFinanceSelectors();
  
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<'expense' | 'income'>('expense');
  const [entryVisible, setEntryVisible] = useState(false);
  const [scanRequestId, setScanRequestId] = useState<number | null>(null);
  const [layoutEditorVisible, setLayoutEditorVisible] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<HomeSectionKey[]>(DEFAULT_HOME_SECTION_ORDER);

  const heroBg = '#1A1E14'; 
  const heroSub = '#8A8F7C';
  const loadingBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(26, 30, 20, 0.12)';

  const deleteTarget = useMemo(
    () => finance.allTransactions.find((tx) => tx.id === deleteTargetId) ?? null,
    [finance.allTransactions, deleteTargetId]
  );

  const handleQuickScan = async () => {
    setEntryMode('expense');
    setScanRequestId(Date.now());
    setEntryVisible(true);
  };

  const handleAddExpense = async () => {
    setEntryMode('expense');
    setScanRequestId(null);
    setEntryVisible(true);
  };

  const handleAddIncome = async () => {
    setEntryMode('income');
    setScanRequestId(null);
    setEntryVisible(true);
  };

  const handleSubmitEntry = async (input: any) => {
    await addTransaction({
      title: input.title,
      amount: input.amount,
      type: input.type,
      walletId: input.walletId,
      categoryId: input.categoryId,
      date: input.loggedAt.toISOString(),
    });
  };

  const firstName = (profile?.full_name ?? 'there').split(' ')[0];
  const greetingMeta = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const salutation = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const dateLabel = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    return { salutation, dateLabel };
  }, []);

  const todaySpentLabel = finance.formatCurrency(finance.today.spentTotal);
  const todayIncomeLabel = finance.formatCurrency(finance.today.incomeTotal);
  const todaySubtitle = `${finance.today.transactionsCount} transaction${finance.today.transactionsCount === 1 ? '' : 's'} today`;

  const greetingSub = finance.month.spentTotal
    ? `You've spent ${Math.max(0, Math.min(100, Math.round((finance.today.spentTotal / finance.month.spentTotal) * 100)))}% of this month's total today.`
    : 'Start tracking expenses to unlock insights.';

  const debtEntries = useMemo(() => {
    const byDue = (a: any, b: any) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    };
    const nearestOwe = [...finance.debts.lists.unsettledOwe].sort(byDue)[0];
    const nearestOwed = [...finance.debts.lists.unsettledOwed].sort(byDue)[0];
    return [nearestOwe, nearestOwed].filter(Boolean);
  }, [finance.debts.lists.unsettledOwe, finance.debts.lists.unsettledOwed]);

  const categoryById = useMemo(() => {
    const map = new Map<string, CategoryRecord>();
    for (const category of state.categories) {
      if (!category.deleted_at) {
        map.set(category.id, category);
      }
    }
    return map;
  }, [state]);

  const budgetEntries = useMemo(() => {
    const toPeriodLabel = (period: string) => {
      if (period === 'daily') return 'Daily';
      if (period === 'weekly') return 'Weekly';
      if (period === 'yearly') return 'Annual';
      return 'Monthly';
    };

    return finance.insights.budgetUtilization
      .map((entry) => {
        const category = categoryById.get(entry.budget.category_id);
        const fallback = entry.budget.category_id ? 'Category' : 'Uncategorized';
        return {
          id: entry.budget.id,
          title: category?.name ?? fallback,
          icon: category?.icon ?? 'apps-outline',
          color: category?.color ?? (isDark ? theme.lime : theme.limeDark),
          periodLabel: toPeriodLabel(entry.budget.period),
          spent: entry.spent,
          limit: entry.budget.amount_limit,
          percentage: entry.percentage,
          overLimit: entry.overLimit,
          remaining: Math.max(0, entry.budget.amount_limit - entry.spent),
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [finance, categoryById, isDark, theme.lime, theme.limeDark]);

  const goalEntries = useMemo(() => {
    const activeGoals = finance.goals.filter((goal) => {
      const total = Number.isFinite(goal.target_amount) ? goal.target_amount : 0;
      const saved = Number.isFinite(goal.saved_amount) ? goal.saved_amount : 0;
      return Math.max(0, total - saved) > 0;
    });

    const byPriority = (a: any, b: any) => {
      const hasDateA = Boolean(a.deadline);
      const hasDateB = Boolean(b.deadline);

      if (hasDateA && hasDateB) {
        const dateCompare = String(a.deadline).localeCompare(String(b.deadline));
        if (dateCompare !== 0) return dateCompare;
      } else if (hasDateA) {
        return -1;
      } else if (hasDateB) {
        return 1;
      }

      const totalA = Number.isFinite(a.target_amount) ? a.target_amount : 0;
      const savedA = Number.isFinite(a.saved_amount) ? a.saved_amount : 0;
      const progressA = totalA > 0 ? savedA / totalA : 0;

      const totalB = Number.isFinite(b.target_amount) ? b.target_amount : 0;
      const savedB = Number.isFinite(b.saved_amount) ? b.saved_amount : 0;
      const progressB = totalB > 0 ? savedB / totalB : 0;

      return progressB - progressA;
    };

    return [...activeGoals].sort(byPriority).slice(0, 2);
  }, [finance.goals]);

  const moveSection = (section: HomeSectionKey, direction: -1 | 1) => {
    setSectionOrder((prev) => {
      const currentIndex = prev.indexOf(section);
      const targetIndex = currentIndex + direction;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
      return next;
    });
  };

  const renderReorderableSection = (sectionKey: HomeSectionKey) => {
    if (sectionKey === 'accounts') {
      if (finance.wallets.length === 0) {
        return null;
      }

      return (
        <AccountsSection
          wallets={finance.wallets}
          formatCurrency={finance.formatCurrency}
          onPressSeeAll={() => router.push('/profile/manage-wallets')}
        />
      );
    }

    if (sectionKey === 'goals') {
      if (goalEntries.length === 0) {
        return null;
      }

      return (
        <>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.tertiary }]}>GOALS</Text>
            <Pressable onPress={() => router.push('/profile/manage-goals')} hitSlop={10}>
              <Text style={[s.sectionLink, { color: theme.secondary }]}>See all</Text>
            </Pressable>
          </View>
          <View style={s.goalList}>
            {goalEntries.map((goal) => (
              <GoalSummaryCard
                key={goal.id}
                goal={goal}
                formatCurrency={finance.formatCurrency}
                onPress={() => router.push(`/profile/goal-detail/${goal.id}`)}
              />
            ))}
          </View>
        </>
      );
    }

    if (sectionKey === 'debt') {
      if (debtEntries.length === 0) {
        return null;
      }

      return (
        <>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.tertiary }]}>DEBT TRACKER</Text>
          </View>
          <View style={s.debtList}>
            {debtEntries.map((entry) => (
              <DebtSummaryCard
                key={entry.id}
                entry={entry}
                formatCurrency={finance.formatCurrency}
                onPress={() => router.push(`/profile/debt-detail/${entry.id}`)}
              />
            ))}
          </View>
        </>
      );
    }

    if (sectionKey === 'budget') {
      return (
        <>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.tertiary }]}>BUDGETS</Text>
            <Pressable onPress={() => router.push('/profile/manage-budgets')} hitSlop={10}>
              <Text style={[s.sectionLink, { color: theme.secondary }]}>See all</Text>
            </Pressable>
          </View>

          {budgetEntries.length === 0 ? (
            <Pressable onPress={() => router.push('/profile/manage-budgets')}>
              {({ pressed }) => (
                <View
                  style={[
                    s.budgetEmptyCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      opacity: pressed ? 0.94 : 1,
                    },
                  ]}
                >
                  <View style={[s.budgetEmptyIconWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                    <Ionicons name="pie-chart-outline" size={18} color={theme.secondary} />
                  </View>
                  <View style={s.budgetEmptyTextWrap}>
                    <Text style={[s.budgetEmptyTitle, { color: theme.text }]}>No budgets yet</Text>
                    <Text style={[s.budgetEmptyBody, { color: theme.secondary }]}>Set your first category budget to start tracking spending limits.</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.tertiary} />
                </View>
              )}
            </Pressable>
          ) : (
            <View style={s.budgetList}>
              {budgetEntries.slice(0, 3).map((entry) => (
                <BudgetSummaryCard
                  key={entry.id}
                  title={entry.title}
                  icon={entry.icon}
                  color={entry.color}
                  periodLabel={entry.periodLabel}
                  spentLabel={finance.formatCurrency(entry.spent)}
                  limitLabel={finance.formatCurrency(entry.limit)}
                  statusText={entry.overLimit ? `Over by ${finance.formatCurrency(entry.spent - entry.limit)}` : `${finance.formatCurrency(entry.remaining)} remaining`}
                  percentage={entry.percentage}
                  overLimit={entry.overLimit}
                  onPress={() => router.push('/profile/manage-budgets')}
                />
              ))}
            </View>
          )}
        </>
      );
    }

    return (
      <>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: theme.tertiary }]}>RECENT ACTIVITY</Text>
        </View>

        <View style={s.transactionList}>
          {finance.loading ? (
            <View style={[s.emptyStateCard, { borderColor: loadingBorder }]}> 
              <ActivityIndicator color={theme.secondary} size="small" />
            </View>
          ) : finance.recentTransactions.length === 0 ? (
            <View style={[s.emptyStateCard, { borderColor: loadingBorder }]}> 
              <Ionicons name="receipt-outline" size={24} color={theme.tertiary} style={{ marginBottom: 8 }} />
              <Text style={[s.emptyStateTitle, { color: theme.text }]}>No transactions yet</Text>
              <Text style={[s.emptyStateBody, { color: theme.tertiary }]}>Start tracking by adding your first expense.</Text>
            </View>
          ) : (
            finance.recentTransactions.map((tx) => {
              const amountLabel = `${tx.type === 'income' ? '+' : ''}${finance.formatCurrency(tx.amount)}`;
              const normalized = tx.title.toLowerCase();
              const kind = normalized.includes('scan') ? 'scan' : tx.type === 'income' ? 'income' : 'expense';

              return (
                <TransactionCard
                  key={tx.id}
                  title={tx.title}
                  categoryName={`${tx.categoryName} • ${tx.walletName}`}
                  categoryIcon={tx.categoryIcon}
                  categoryColor={tx.categoryColor}
                  amountLabel={amountLabel}
                  timeLabel={tx.relativeDay}
                  kind={kind}
                  onDeletePress={() => setDeleteTargetId(tx.id)}
                />
              );
            })
          )}
        </View>
      </>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}> 
      <ScrollView 
        contentContainerStyle={s.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.greetingContainer}>
          <View style={s.greetingRow}>
            <View style={s.greetingTextWrap}>
              <Text style={[s.greetingDate, { color: theme.secondary }]}>{greetingMeta.dateLabel}</Text>
              <Text style={[s.greetingTitle, { color: theme.text }]}> 
                <Text style={{ fontWeight: '400' }}>{greetingMeta.salutation},{'\n'}</Text>{firstName}
              </Text>
              <Text style={[s.greetingSub, { color: theme.secondary }]}>{greetingSub}</Text>
            </View>

            <View style={s.topActionButtons}>
              <Pressable
                onPress={() => setLayoutEditorVisible(true)}
                hitSlop={10}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      s.headerIconButton,
                      s.arrangeButton,
                      {
                        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(60, 60, 67, 0.14)',
                        opacity: pressed ? 0.88 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <Ionicons name="swap-vertical-outline" size={17} color={isDark ? '#F2F2F7' : '#1C1C1E'} />
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => router.push('/activity')}
                hitSlop={10}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      s.headerIconButton,
                      s.notifyButton,
                      {
                        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(60, 60, 67, 0.14)',
                        opacity: pressed ? 0.88 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <Ionicons name="notifications-outline" size={17} color={isDark ? '#F2F2F7' : '#1C1C1E'} />
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {financeError ? (
          <Animated.View entering={FadeIn.duration(400)} style={[s.syncErrorBanner, { backgroundColor: isDark ? 'rgba(255,107,107,0.12)' : 'rgba(255,107,107,0.08)', borderColor: isDark ? 'rgba(255,107,107,0.28)' : 'rgba(255,107,107,0.2)' }]}>
            <Text style={s.syncErrorText}>{financeError}</Text>
          </Animated.View>
        ) : null}

        {/* ── Main Hero Card ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(150).duration(600)} style={[s.card, { backgroundColor: heroBg }]}>
          <View style={s.cardDeco1} />
          <View style={s.cardDeco2} />

          <View style={s.cardHeaderRow}>
            <Text style={[s.cardLabel, { color: heroSub }]}>TODAY&apos;S FLOW</Text>
          </View>

          <View style={s.cardStatsRow}>
            <View style={s.cardStatChip}>
              <View style={s.cardStatIconRow}>
                <Ionicons name="arrow-down-circle" size={16} color="#4ADE80" />
                <Text style={s.cardStatLabel}>INCOME</Text>
              </View>
              <Text style={s.cardStatAmount} numberOfLines={1} adjustsFontSizeToFit>{todayIncomeLabel}</Text>
            </View>

            <View style={s.cardStatDivider} />

            <View style={s.cardStatChip}>
              <View style={s.cardStatIconRow}>
                <Ionicons name="arrow-up-circle" size={16} color="#F87171" />
                <Text style={s.cardStatLabel}>SPENT</Text>
              </View>
              <Text style={[s.cardStatAmount, { color: '#FFFFFF' }]} numberOfLines={1} adjustsFontSizeToFit>{todaySpentLabel}</Text>
            </View>
          </View>

          <View style={s.cardDivider} />
          <Text style={[s.cardSub, { color: heroSub }]}>{todaySubtitle}</Text>
        </Animated.View>

        {sectionOrder.map((sectionKey, index) => {
          const section = renderReorderableSection(sectionKey);
          if (!section) {
            return null;
          }

          const sectionStyle =
            sectionKey === 'accounts'
              ? s.walletSection
              : sectionKey === 'goals'
                ? s.goalSection
                : sectionKey === 'debt'
                  ? s.debtSection
                  : sectionKey === 'budget'
                    ? s.budgetSection
                  : undefined;

          return (
            <Animated.View
              key={sectionKey}
              entering={FadeInDown.delay(200 + index * 45).duration(600)}
              style={[s.movableSection, sectionStyle]}
            >
              {section}
            </Animated.View>
          );
        })}

      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={layoutEditorVisible}
        onRequestClose={() => setLayoutEditorVisible(false)}
      >
        <View style={s.layoutEditorBackdrop}>
          <View style={[s.layoutEditorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <View style={s.layoutEditorHeader}>
              <Text style={[s.layoutEditorTitle, { color: theme.text }]}>Arrange Home Sections</Text>
              <Pressable
                onPress={() => setLayoutEditorVisible(false)}
                hitSlop={10}
                style={({ pressed }) => [s.layoutEditorClose, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>

            <Text style={[s.layoutEditorHint, { color: theme.secondary }]}>Move sections up or down. Current order is your default until you change it.</Text>

            <View style={s.layoutEditorList}>
              {sectionOrder.map((sectionKey, index) => {
                const atTop = index === 0;
                const atBottom = index === sectionOrder.length - 1;

                return (
                  <View key={sectionKey} style={[s.layoutEditorItem, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
                    <Text style={[s.layoutEditorItemLabel, { color: theme.text }]}>{HOME_SECTION_LABELS[sectionKey]}</Text>
                    <View style={s.layoutEditorItemActions}>
                      <Pressable
                        onPress={() => moveSection(sectionKey, -1)}
                        hitSlop={8}
                        disabled={atTop}
                        style={({ pressed }) => [
                          s.layoutEditorAction,
                          {
                            borderColor: theme.border,
                            opacity: atTop ? 0.35 : pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <Ionicons name="chevron-up" size={14} color={theme.text} />
                      </Pressable>
                      <Pressable
                        onPress={() => moveSection(sectionKey, 1)}
                        hitSlop={8}
                        disabled={atBottom}
                        style={({ pressed }) => [
                          s.layoutEditorAction,
                          {
                            borderColor: theme.border,
                            opacity: atBottom ? 0.35 : pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <Ionicons name="chevron-down" size={14} color={theme.text} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={s.layoutEditorFooter}>
              <Pressable
                onPress={() => setSectionOrder(DEFAULT_HOME_SECTION_ORDER)}
                hitSlop={10}
                style={({ pressed }) => [
                  s.layoutEditorReset,
                  {
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[s.layoutEditorResetText, { color: theme.text }]}>Reset to Default</Text>
              </Pressable>
              <Pressable
                onPress={() => setLayoutEditorVisible(false)}
                hitSlop={10}
                style={({ pressed }) => [
                  s.layoutEditorDone,
                  {
                    backgroundColor: theme.lime,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[s.layoutEditorDoneText, { color: theme.bg }]}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDeleteModal
        visible={Boolean(deleteTargetId)}
        message={deleteTarget ? `Delete "${deleteTarget.title}"?` : 'Delete this transaction?'}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) await deleteTransaction(deleteTargetId);
          setDeleteTargetId(null);
        }}
      />

      <QuickActionFab onQuickScan={handleQuickScan} onAddExpense={handleAddExpense} onAddIncome={handleAddIncome} />
      <TransactionEntryModal
        visible={entryVisible}
        mode={entryMode}
        scanRequestId={scanRequestId}
        wallets={finance.wallets}
        categories={state.categories}
        onClose={() => { setEntryVisible(false); setScanRequestId(null); }}
        onSubmit={handleSubmitEntry}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 18,
    paddingBottom: 120 
  },
  
  greetingContainer: { marginTop: 8, marginBottom: 20 },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  greetingTextWrap: {
    flex: 1,
  },
  topActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  arrangeButton: {
    shadowOpacity: 0.12,
    elevation: 3,
  },
  notifyButton: {
    shadowOpacity: 0.11,
  },
  greetingDate: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  greetingTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 4, lineHeight: 36 },
  greetingSub: { fontSize: 14, fontWeight: '500', lineHeight: 20, paddingRight: 6 },
  
  syncErrorBanner: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 16 },
  syncErrorText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },

  card: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  cardDeco1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(200, 245, 96, 0.08)', top: -80, right: -60 },
  cardDeco2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(200, 245, 96, 0.05)', bottom: -40, left: -40 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  
  cardStatsRow: { flexDirection: 'row', alignItems: 'center' },
  cardStatChip: { flex: 1 },
  cardStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 16 },
  cardStatIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardStatLabel: { fontSize: 10, fontWeight: '800', color: '#8A8F7C', letterSpacing: 1.2 },
  cardStatAmount: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 20, marginBottom: 12 },
  cardSub: { fontSize: 12, fontWeight: '500' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, opacity: 0.9 },
  sectionLink: { fontSize: 12, fontWeight: '700' },

  movableSection: { marginBottom: 24 },
  walletSection: {},

  // Debt Section
  goalSection: {},
  goalList: { gap: 10 },
  budgetSection: { marginBottom: 24 },
  budgetList: {
    gap: 10,
  },
  budgetEmptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  budgetEmptyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetEmptyTextWrap: {
    flex: 1,
  },
  budgetEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  budgetEmptyBody: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  debtSection: {},
  debtList: { gap: 10 },

  // Recent Activity
  transactionList: { gap: 8 },

  layoutEditorBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  layoutEditorCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  layoutEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  layoutEditorTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  layoutEditorClose: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutEditorHint: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 12,
  },
  layoutEditorList: {
    gap: 8,
  },
  layoutEditorItem: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  layoutEditorItemLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  layoutEditorItemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  layoutEditorAction: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutEditorFooter: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  layoutEditorReset: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutEditorResetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  layoutEditorDone: {
    flex: 1,
    borderRadius: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutEditorDoneText: {
    fontSize: 12,
    fontWeight: '800',
  },
  
  emptyStateCard: {
    borderRadius: 20, borderWidth: 1, borderStyle: 'dashed',
    paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center'
  },
  emptyStateTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  emptyStateBody: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 18 },
});