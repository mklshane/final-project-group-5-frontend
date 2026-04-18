import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { WALLET_TYPE_ICONS } from '@/constants/defaultWallets';
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
import type { CategoryRecord } from '@/types/finance';

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

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}> 
      <ScrollView 
        contentContainerStyle={s.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.greetingContainer}>
          <Text style={[s.greetingDate, { color: theme.secondary }]}>{greetingMeta.dateLabel}</Text>
          <Text style={[s.greetingTitle, { color: theme.text }]}>
            <Text style={{ fontWeight: '400' }}>{greetingMeta.salutation},{'\n'}</Text>{firstName}
          </Text>
          <Text style={[s.greetingSub, { color: theme.secondary }]}>{greetingSub}</Text>
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

        {/* ── Wallets Carousel ──────────────────────────── */}
        {finance.wallets.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={s.walletSection}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: theme.tertiary }]}>ACCOUNTS</Text>
              <Pressable onPress={() => router.push('/profile/manage-wallets')} hitSlop={10}>
                <Text style={[s.sectionLink, { color: theme.secondary }]}>See all</Text>
              </Pressable>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={s.walletScrollWrap}
              contentContainerStyle={s.walletScrollContent}
            >
              {finance.wallets.map((wallet) => (
                <View
                  key={wallet.id}
                  style={[
                    s.walletCard,
                    {
                      backgroundColor: isDark ? theme.surfaceAlt : theme.surface,
                      borderColor: theme.border,
                      shadowColor: isDark ? '#000' : '#8A8F7C',
                    },
                  ]}
                >
                  <View style={s.walletCardTop}>
                    <View style={[s.walletIconWrap, { backgroundColor: isDark ? 'rgba(200,245,96,0.12)' : 'rgba(155,194,58,0.12)' }]}>
                      <Ionicons
                        name={WALLET_TYPE_ICONS[wallet.type] as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={isDark ? theme.lime : theme.limeDark}
                      />
                    </View>
                    <Text style={[s.walletAmount, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                      {finance.formatCurrency(wallet.current_balance)}
                    </Text>
                  </View>
                  <View style={s.walletCardBottom}>
                    <Text style={[s.walletName, { color: theme.secondary }]} numberOfLines={1}>
                      {wallet.name}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* ── Debt Tracker ─────────────────────────────── */}
        {goalEntries.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={s.goalSection}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: theme.tertiary }]}>GOALS</Text>
              <Pressable onPress={() => router.push('/profile/manage-goals')} hitSlop={10}>
                <Text style={[s.sectionLink, { color: theme.secondary }]}>View all</Text>
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
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(275).duration(600)} style={s.budgetSection}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.tertiary }]}>BUDGETS</Text>
            <Pressable onPress={() => router.push('/profile/manage-budgets')} hitSlop={10}>
              <Text style={[s.sectionLink, { color: theme.secondary }]}>Manage</Text>
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
            <>
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
            </>
          )}
        </Animated.View>

        {/* ── Debt Tracker ─────────────────────────────── */}
        {debtEntries.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={s.debtSection}>
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
          </Animated.View>
        ) : null}

        {/* ── Recent Transactions ───────────────────────── */}
        <Animated.View entering={FadeInDown.delay(350).duration(600)}>
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
        </Animated.View>
      </ScrollView>

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
  greetingDate: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  greetingTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 4, lineHeight: 36 },
  greetingSub: { fontSize: 14, fontWeight: '500', lineHeight: 20, paddingRight: 20 },
  
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

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, opacity: 0.9 },
  sectionLink: { fontSize: 12, fontWeight: '700' },

  walletSection: { marginBottom: 24 },
  walletScrollWrap: { marginHorizontal: -24 }, 
  walletScrollContent: { paddingHorizontal: 24, gap: 12 },
  walletCard: {
    width: 140,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  walletCardTop: { gap: 10 },
  walletIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  walletAmount: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  walletCardBottom: { marginTop: 6 },
  walletName: { fontSize: 12, fontWeight: '600' },

  // Debt Section
  goalSection: { marginBottom: 24 },
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
  debtSection: { marginBottom: 24 },
  debtList: { gap: 10 },

  // Recent Activity
  transactionList: { gap: 8 },
  
  emptyStateCard: {
    borderRadius: 20, borderWidth: 1, borderStyle: 'dashed',
    paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center'
  },
  emptyStateTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  emptyStateBody: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 18 },
});