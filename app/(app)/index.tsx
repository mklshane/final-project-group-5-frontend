import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { QuickActionFab } from '@/components/Base/QuickActionFab';
import { TransactionCard } from '@/components/Base/TransactionCard';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { profile } = useAuth();
  const { addTransaction, deleteTransaction } = useFinanceData();
  const finance = useFinanceSelectors();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const isDark = colorScheme === 'dark';
  const palette = {
    screenBg: isDark ? '#111410' : '#F4F5E9',
    cardBg: isDark ? '#1A1E14' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26, 30, 20, 0.12)',
    heading: isDark ? '#EDF0E4' : '#1A1E14',
    subtext: isDark ? '#8A8F7C' : '#6B7060',
    tertiary: isDark ? '#585D4C' : '#9DA28F',
    logoBg: isDark ? '#C8F560' : '#1A1E14',
    logoIcon: isDark ? '#1A1E14' : '#C8F560',
    betaBg: isDark ? 'rgba(200, 245, 96, 0.16)' : 'rgba(200, 245, 96, 0.3)',
    betaText: '#8AAB32',
    heroBg: isDark ? '#222618' : '#222618',
    heroSub: isDark ? '#8A8F7C' : '#8A8F7C',
    loadingBorder: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(26, 30, 20, 0.12)',
  };

  const deleteTarget = useMemo(
    () => finance.allTransactions.find((tx) => tx.id === deleteTargetId) ?? null,
    [finance.allTransactions, deleteTargetId]
  );

  const handleQuickScan = async () => {
    await addTransaction({
      title: 'Quick scan receipt',
      amount: 250,
      type: 'expense',
    });
  };

  const handleAddExpense = async () => {
    await addTransaction({
      title: 'Manual expense',
      amount: 120,
      type: 'expense',
    });
  };

  const handleAddIncome = async () => {
    await addTransaction({
      title: 'Manual income',
      amount: 500,
      type: 'income',
    });
  };

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteTransaction(deleteTargetId);
    setDeleteTargetId(null);
  };

  const firstName = (profile?.full_name ?? 'there').split(' ')[0];
  const spentTodayLabel = finance.formatCurrency(finance.today.spentTotal);
  const todaySubtitle = `${finance.today.transactionsCount} transaction${
    finance.today.transactionsCount === 1 ? '' : 's'
  } today`;

  const greetingSub = finance.month.spentTotal
    ? `You are at ${Math.max(0, Math.min(100, Math.round((finance.today.spentTotal / finance.month.spentTotal) * 100)))}% of this month's spend today.`
    : 'Start tracking expenses to unlock insights and patterns.';
  const walletPreview = finance.wallets.slice(0, 3);
  const hasMoreWallets = finance.wallets.length > 3;

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: palette.screenBg }]}> 
      <ScrollView 
        contentContainerStyle={s.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.logoContainer}>
            <View style={s.logoCircle}>
              <Ionicons name="happy" size={20} color={palette.logoIcon} />
            </View>
            <Text style={[s.brandText, { color: palette.heading }]}>Budgy</Text>
            <View style={[s.betaBadge, { backgroundColor: palette.betaBg }]}> 
              <Text style={[s.betaText, { color: palette.betaText }]}>BETA</Text>
            </View>
          </View>
          
          {/* We can add profile picture or notification icon here if needed later */}
        </View>

        {/* ── Greeting ──────────────────────────────────── */}
        <View style={s.greetingContainer}>
          <Text style={[s.greetingTitle, { color: palette.heading }]}>Hey, {firstName}</Text>
          <Text style={[s.greetingSub, { color: palette.subtext }]}>{greetingSub}</Text>
        </View>

        {/* ── Main Card ─────────────────────────────────── */}
        <View style={[s.card, { backgroundColor: palette.heroBg }]}> 
          {/* Decorative Circles */}
          <View style={s.cardDeco1} />
          <View style={s.cardDeco2} />

          <Text style={[s.cardLabel, { color: palette.heroSub }]}>SPENT TODAY</Text>
          <Text style={s.cardAmount}>{spentTodayLabel}</Text>
          <Text style={[s.cardSub, { color: palette.heroSub }]}>{todaySubtitle}</Text>
        </View>

        {finance.wallets.length > 0 ? (
          <View style={s.walletDistributionWrap}>
            <View style={s.walletHeaderRow}>
              <Text style={[s.walletDistributionLabel, { color: palette.tertiary }]}>WALLETS</Text>
              {hasMoreWallets ? (
                <Pressable onPress={() => router.push('/(app)/profile/manage-wallets')}>
                  <Text style={[s.walletSeeAll, { color: palette.subtext }]}>See all</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={s.walletDistributionRow}>
              {walletPreview.map((wallet) => (
                <View
                  key={wallet.id}
                  style={[
                    s.walletItem,
                    walletPreview.length === 1
                      ? s.walletItemFull
                      : walletPreview.length === 2
                        ? s.walletItemHalf
                        : s.walletItemThird,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,30,20,0.03)',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,30,20,0.08)',
                    },
                  ]}
                >
                  <Text style={[s.walletName, { color: palette.subtext }]} numberOfLines={1}>
                    {wallet.name}
                  </Text>
                  <Text style={[s.walletAmount, { color: palette.heading }]}>
                    {finance.formatCurrency(wallet.current_balance)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Recent Transactions ───────────────────────── */}
        <View style={s.recentHeader}>
          <Text style={[s.recentTitle, { color: palette.tertiary }]}>RECENT</Text>
        </View>

        <View style={s.transactionList}>
          {finance.loading ? (
            <View style={[s.loadingStateCard, { borderColor: palette.loadingBorder }]}> 
              <Text style={[s.loadingStateText, { color: palette.tertiary }]}>Loading transactions...</Text>
            </View>
          ) : finance.recentTransactions.length === 0 ? (
            <View style={[s.emptyStateCard, { borderColor: palette.loadingBorder }]}> 
              <Text style={[s.emptyStateTitle, { color: palette.heading }]}>No transactions yet</Text>
              <Text style={[s.emptyStateBody, { color: palette.tertiary }]}>Start tracking by adding your first expense or income.</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1E14',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1E14',
    letterSpacing: -0.5,
  },
  betaBadge: {
    backgroundColor: 'rgba(200, 245, 96, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    marginTop: 2,
  },
  betaText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8AAB32',
    letterSpacing: 1,
  },

  // Greeting
  greetingContainer: {
    marginBottom: 24,
  },
  walletDistributionWrap: {
    marginBottom: 14,
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
  walletItem: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
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
  walletName: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.82,
    maxWidth: '62%',
  },
  walletAmount: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.9,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1E14',
    letterSpacing: -1,
    marginBottom: 8,
  },
  greetingSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7060',
    lineHeight: 20,
    paddingRight: 20,
  },

  // Main Card
  card: {
    backgroundColor: '#222618',
    borderRadius: 24,
    padding: 28,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 32,
  },
  cardDeco1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(200, 245, 96, 0.05)',
    top: -50,
    right: -50,
  },
  cardDeco2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(200, 245, 96, 0.03)',
    bottom: -30,
    right: 40,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8F7C',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  cardAmount: {
    fontSize: 56,
    fontWeight: '800',
    color: '#C8F560',
    letterSpacing: -2,
    marginBottom: 12,
  },
  cardSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A8F7C',
  },

  // Recent Section
  recentHeader: {
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9DA28F',
    letterSpacing: 2,
  },
  transactionList: {
    gap: 12,
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