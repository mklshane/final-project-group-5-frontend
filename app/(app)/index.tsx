import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { WALLET_TYPE_ICONS } from '@/constants/defaultWallets';
import { useAuth } from '@/context/AuthContext';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { QuickActionFab } from '@/components/Base/QuickActionFab';
import { TransactionCard } from '@/components/Base/TransactionCard';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { TransactionEntryModal } from '@/components/Base/TransactionEntryModal';

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

  const heroBg = '#222618';
  const heroSub = '#8A8F7C';
  const loadingBorder = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(26, 30, 20, 0.12)';

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

  const handleSubmitEntry = async (input: {
    title: string;
    amount: number;
    type: 'expense' | 'income';
    walletId: string | null;
    categoryId: string | null;
    loggedAt: Date;
  }) => {
    await addTransaction({
      title: input.title,
      amount: input.amount,
      type: input.type,
      walletId: input.walletId,
      categoryId: input.categoryId,
      date: input.loggedAt.toISOString(),
    });
  };

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    setDeleteTargetId(null);
    await deleteTransaction(targetId);
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
  const spentTodayLabel = finance.formatCurrency(finance.today.spentTotal);
  const todaySubtitle = `${finance.today.transactionsCount} transaction${
    finance.today.transactionsCount === 1 ? '' : 's'
  } today`;

  const greetingSub = finance.month.spentTotal
    ? `You are at ${Math.max(0, Math.min(100, Math.round((finance.today.spentTotal / finance.month.spentTotal) * 100)))}% of this month's spend today.`
    : 'Start tracking expenses to unlock insights and patterns.';
  const walletPreview = finance.wallets.slice(0, 4);
  const hasMoreWallets = finance.wallets.length > 4;
  const walletRows = useMemo(() => {
    if (walletPreview.length === 0) return [] as typeof walletPreview[];
    if (walletPreview.length <= 2) return [walletPreview];
    if (walletPreview.length === 3) return [[walletPreview[0]], [walletPreview[1], walletPreview[2]]];
    return [walletPreview.slice(0, 2), walletPreview.slice(2, 4)];
  }, [walletPreview]);
  const debtEntries = useMemo(
    () => [...finance.debts.lists.unsettledOwe, ...finance.debts.lists.unsettledOwed],
    [finance.debts.lists.unsettledOwe, finance.debts.lists.unsettledOwed]
  );
  const showDebtSummary = debtEntries.length > 0;

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}> 
      <ScrollView 
        contentContainerStyle={s.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ──────────────────────────────────── */}
        <View style={s.greetingContainer}>
          <Text style={[s.greetingDate, { color: theme.secondary }]}>{greetingMeta.dateLabel}</Text>
          <Text style={[s.greetingTitle, { color: theme.text }]}>
            <Text style={{ fontWeight: '400' }}>{greetingMeta.salutation}
            {', '}</Text>{firstName}
          </Text>
          <Text style={[s.greetingSub, { color: theme.secondary }]}>{greetingSub}</Text>
        </View>

        {financeError ? (
          <View
            style={[
              s.syncErrorBanner,
              {
                backgroundColor: isDark ? 'rgba(255,107,107,0.12)' : 'rgba(255,107,107,0.08)',
                borderColor: isDark ? 'rgba(255,107,107,0.28)' : 'rgba(255,107,107,0.2)',
              },
            ]}
          >
            <Text style={s.syncErrorText}>{financeError}</Text>
          </View>
        ) : null}

        {/* ── Main Card ─────────────────────────────────── */}
        <View style={[s.card, { backgroundColor: heroBg }]}> 
          {/* Decorative Circles */}
          <View style={s.cardDeco1} />
          <View style={s.cardDeco2} />

          <Text style={[s.cardLabel, { color: heroSub }]}>SPENT TODAY</Text>
          <Text style={s.cardAmount}>{spentTodayLabel}</Text>
          <Text style={[s.cardSub, { color: heroSub }]}>{todaySubtitle}</Text>
        </View>

        {finance.wallets.length > 0 ? (
          <View style={s.walletDistributionWrap}>
            <View style={s.walletHeaderRow}>
              <Text style={[s.walletDistributionLabel, { color: theme.tertiary }]}>WALLETS</Text>
              {hasMoreWallets ? (
                <Pressable onPress={() => router.push('/(app)/profile/manage-wallets')}>
                  <Text style={[s.walletSeeAll, { color: theme.secondary }]}>See all wallets</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={s.walletRowsWrap}>
              {walletRows.map((row, rowIndex) => (
                <View key={`wallet-row-${rowIndex}`} style={s.walletDistributionRow}>
                  {row.map((wallet) => (
                    <View
                      key={wallet.id}
                      style={[
                        s.walletItem,
                        row.length === 1 ? s.walletItemFull : s.walletItemHalf,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,30,20,0.03)',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,30,20,0.08)',
                        },
                      ]}
                    >
                      <View style={s.walletLeft}>
                        <View
                          style={[
                            s.walletIconWrap,
                            { backgroundColor: isDark ? 'rgba(200,245,96,0.14)' : 'rgba(26,30,20,0.07)' },
                          ]}
                        >
                          <Ionicons
                            name={WALLET_TYPE_ICONS[wallet.type] as keyof typeof Ionicons.glyphMap}
                            size={13}
                            color={isDark ? '#C8F560' : '#1A1E14'}
                          />
                        </View>

                        <View style={s.walletTextWrap}>
                          <Text style={[s.walletName, { color: theme.text }]} numberOfLines={1}>
                            {wallet.name}
                          </Text>
                          <Text style={[s.walletType, { color: theme.secondary }]} numberOfLines={1}>
                            {wallet.typeLabel ?? wallet.type}
                          </Text>
                        </View>
                      </View>

                      <Text style={[s.walletAmount, { color: theme.text }]} numberOfLines={1}>
                        {finance.formatCurrency(wallet.current_balance)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {showDebtSummary ? (
          <View style={s.debtSummaryWrap}>
            <Text style={[s.debtSummaryLabel, { color: theme.tertiary }]}>DEBT TRACKER</Text>
            <View style={s.debtSummaryList}>
              {debtEntries.map((entry) => {
                const isOwe = entry.type === 'owe';
                const counterparty = entry.counterparty_name ?? entry.person_name ?? 'Unknown';
                const dueText = entry.due_date ? `Due ${entry.due_date}` : 'No due date';
                const progressPercent =
                  entry.totalAmount > 0
                    ? Math.max(0, Math.min(100, Math.round((entry.amountPaid / entry.totalAmount) * 100)))
                    : 0;
                const statusLabel = isOwe ? 'PAYABLE' : 'RECEIVABLE';
                const statusColor = isOwe ? '#C9793B' : '#3E78C2';
                const iconName = isOwe ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline';

                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => router.push(`/(app)/profile/debt-detail/${entry.id}`)}
                    style={[
                      s.debtSummaryCard,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,30,20,0.03)',
                        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(26,30,20,0.10)',
                      },
                    ]}
                  >
                    <View style={s.debtSummaryTopRow}>
                      <View style={s.debtSummaryIdentityRow}>
                        <View
                          style={[
                            s.debtSummaryIconWrap,
                            {
                              backgroundColor: isDark
                                ? isOwe
                                  ? 'rgba(255,173,92,0.17)'
                                  : 'rgba(107,163,255,0.17)'
                                : isOwe
                                  ? 'rgba(255,173,92,0.14)'
                                  : 'rgba(107,163,255,0.12)',
                            },
                          ]}
                        >
                          <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={15} color={statusColor} />
                        </View>
                        <View style={s.debtSummaryTextWrap}>
                          <Text style={[s.debtSummaryTitle, { color: theme.text }]} numberOfLines={1}>
                            {counterparty}
                          </Text>
                          <Text style={[s.debtSummaryMeta, { color: theme.secondary }]} numberOfLines={1}>
                            {dueText}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          s.debtSummaryPill,
                          {
                            backgroundColor: isDark
                              ? isOwe
                                ? 'rgba(255,173,92,0.2)'
                                : 'rgba(107,163,255,0.2)'
                              : isOwe
                                ? 'rgba(255,173,92,0.16)'
                                : 'rgba(107,163,255,0.14)',
                          },
                        ]}
                      >
                        <Text style={[s.debtSummaryPillText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>

                    <View style={s.debtSummaryBottomRow}>
                      <Text style={[s.debtSummaryAmount, { color: theme.text }]}>{finance.formatCurrency(entry.remainingAmount)}</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.tertiary} />
                    </View>

                    {entry.amountPaid > 0 && entry.totalAmount > 0 ? (
                      <>
                        <View style={[s.debtProgressTrack, { backgroundColor: theme.surfaceDeep }]}> 
                          <View
                            style={[
                              s.debtProgressFill,
                              {
                                width: `${progressPercent}%`,
                                backgroundColor: isOwe ? '#6AAE44' : '#4F93DD',
                              },
                            ]}
                          />
                        </View>
                        <View style={s.debtProgressRow}>
                          <Text style={[s.debtProgressText, { color: theme.secondary }]}>
                            {isOwe ? 'Paid' : 'Collected'} {finance.formatCurrency(entry.amountPaid)} of{' '}
                            {finance.formatCurrency(entry.totalAmount)}
                          </Text>
                          <Text style={[s.debtProgressPercent, { color: theme.text }]}>{progressPercent}%</Text>
                        </View>
                      </>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Recent Transactions ───────────────────────── */}
        <View style={s.recentHeader}>
          <Text style={[s.recentTitle, { color: theme.tertiary }]}>RECENT</Text>
        </View>

        <View style={s.transactionList}>
          {finance.loading ? (
            <View style={[s.loadingStateCard, { borderColor: loadingBorder }]}> 
              <Text style={[s.loadingStateText, { color: theme.tertiary }]}>Loading transactions...</Text>
            </View>
          ) : finance.recentTransactions.length === 0 ? (
            <View style={[s.emptyStateCard, { borderColor: loadingBorder }]}> 
              <Text style={[s.emptyStateTitle, { color: theme.text }]}>No transactions yet</Text>
              <Text style={[s.emptyStateBody, { color: theme.tertiary }]}>Start tracking by adding your first expense or income.</Text>
            </View>
          ) : (
            finance.recentTransactions.map((tx) => {
              const amountLabel = `${tx.type === 'income' ? '+' : ''}${finance.formatCurrency(tx.amount)}`;
              const normalized = tx.title.toLowerCase();
              const kind = normalized.includes('scan')
                ? 'scan'
                : tx.type === 'income'
                  ? 'income'
                  : 'expense';

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
                  onDeletePress={() => requestDelete(tx.id)}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      <ConfirmDeleteModal
        visible={Boolean(deleteTargetId)}
        message={
          deleteTarget
            ? `Delete \"${deleteTarget.title}\"? This action cannot be undone.`
            : 'Delete this transaction? This action cannot be undone.'
        }
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      <QuickActionFab
        onQuickScan={handleQuickScan}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
      />

      <TransactionEntryModal
        visible={entryVisible}
        mode={entryMode}
        scanRequestId={scanRequestId}
        wallets={finance.wallets}
        categories={state.categories}
        onClose={() => {
          setEntryVisible(false);
          setScanRequestId(null);
        }}
        onSubmit={handleSubmitEntry}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5E9',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Leave room for FAB
  },
  
  // Header
  // Greeting
  greetingContainer: {
    marginTop: 8,
    marginBottom: 14,
  },
  walletDistributionWrap: {
    marginBottom: 14,
  },
  debtSummaryWrap: {
    marginBottom: 14,
  },
  debtSummaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.85,
    marginBottom: 8,
  },
  debtSummaryList: {
    gap: 8,
  },
  debtSummaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  debtSummaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  debtSummaryIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 9,
  },
  debtSummaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtSummaryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  debtSummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  debtSummaryMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  debtSummaryPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  debtSummaryPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.65,
  },
  debtSummaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  debtSummaryAmount: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  debtProgressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  debtProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  debtProgressRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  debtProgressText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  debtProgressPercent: {
    fontSize: 11,
    fontWeight: '800',
  },
  walletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  walletDistributionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  walletSeeAll: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.8,
  },
  walletDistributionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  walletRowsWrap: {
    gap: 8,
  },
  walletItem: {
    borderWidth: 1,
    borderRadius: 13,
    paddingVertical: 8,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletItemFull: {
    flex: 1,
  },
  walletItemHalf: {
    flex: 1,
  },
  walletItemThird: {
    flex: 1,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flexShrink: 1,
    marginRight: 6,
  },
  walletIconWrap: {
    width: 23,
    height: 23,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  walletTextWrap: {
    minWidth: 0,
    flexShrink: 1,
  },
  walletName: {
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 84,
  },
  walletType: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.78,
    marginTop: 1,
    maxWidth: 84,
  },
  walletAmount: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.95,
    textAlign: 'right',
    marginLeft: 4,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1E14',
    letterSpacing: -1,
    marginBottom: 2,
  },
  greetingDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7060',
    opacity: 0.8,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7060',
    lineHeight: 18,
    paddingRight: 20,
  },

  syncErrorBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
    marginBottom: 12,
  },
  syncErrorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },

  // Main Card
  card: {
    backgroundColor: '#222618',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 18,
  },
  cardDeco1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(200, 245, 96, 0.05)',
    top: -42,
    right: -42,
  },
  cardDeco2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(200, 245, 96, 0.03)',
    bottom: -20,
    right: 26,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8F7C',
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  cardAmount: {
    fontSize: 44,
    fontWeight: '800',
    color: '#C8F560',
    letterSpacing: -1.4,
    marginBottom: 9,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8F7C',
  },

  // Recent Section
  recentHeader: {
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9DA28F',
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  transactionList: {
    gap: 6,
  },
  // Empty / loading states
  loadingStateCard: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(26, 30, 20, 0.12)',
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingStateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9DA28F',
  },
  emptyStateCard: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(26, 30, 20, 0.12)',
    borderStyle: 'dashed',
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1E14',
    marginBottom: 4,
  },
  emptyStateBody: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9DA28F',
    textAlign: 'center',
    lineHeight: 18,
  },

});