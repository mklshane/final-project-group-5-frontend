import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';

const categoryStyles: Record<string, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; iconBg: string }> = {
  Transport: { icon: 'car-outline', iconColor: '#E68A2E', iconBg: 'rgba(230, 138, 46, 0.1)' },
  Food: { icon: 'fast-food-outline', iconColor: '#E65C5C', iconBg: 'rgba(230, 92, 92, 0.1)' },
  Bills: { icon: 'document-text-outline', iconColor: '#4A90E2', iconBg: 'rgba(74, 144, 226, 0.1)' },
  Income: { icon: 'logo-usd', iconColor: '#7DBA00', iconBg: 'rgba(200, 245, 96, 0.3)' },
  Uncategorized: { icon: 'ellipsis-horizontal', iconColor: '#8A8F7C', iconBg: 'rgba(138, 143, 124, 0.16)' },
};

const styleForCategory = (label: string, isIncome: boolean) => {
  if (isIncome) return categoryStyles.Income;
  return categoryStyles[label] ?? categoryStyles.Uncategorized;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const finance = useFinanceSelectors();

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Action to open add transaction modal
  };

  const firstName = (profile?.full_name ?? 'there').split(' ')[0];
  const spentTodayLabel = finance.formatCurrency(finance.today.spentTotal);
  const todaySubtitle = `${finance.today.transactionsCount} transaction${
    finance.today.transactionsCount === 1 ? '' : 's'
  } today`;

  const greetingSub = finance.month.spentTotal
    ? `You are at ${Math.max(0, Math.min(100, Math.round((finance.today.spentTotal / finance.month.spentTotal) * 100)))}% of this month's spend today.`
    : 'Start tracking expenses to unlock insights and patterns.';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={s.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.logoContainer}>
            <View style={s.logoCircle}>
              <Ionicons name="happy" size={20} color="#C8F560" />
            </View>
            <Text style={s.brandText}>Budgy</Text>
            <View style={s.betaBadge}>
              <Text style={s.betaText}>BETA</Text>
            </View>
          </View>
          
          {/* We can add profile picture or notification icon here if needed later */}
        </View>

        {/* ── Greeting ──────────────────────────────────── */}
        <View style={s.greetingContainer}>
          <Text style={s.greetingTitle}>Hey, {firstName}</Text>
          <Text style={s.greetingSub}>{greetingSub}</Text>
        </View>

        {/* ── Main Card ─────────────────────────────────── */}
        <View style={s.card}>
          {/* Decorative Circles */}
          <View style={s.cardDeco1} />
          <View style={s.cardDeco2} />

          <Text style={s.cardLabel}>SPENT TODAY</Text>
          <Text style={s.cardAmount}>{spentTodayLabel}</Text>
          <Text style={s.cardSub}>{todaySubtitle}</Text>
        </View>

        {/* ── Recent Transactions ───────────────────────── */}
        <View style={s.recentHeader}>
          <Text style={s.recentTitle}>RECENT</Text>
        </View>

        <View style={s.transactionList}>
          {finance.loading ? (
            <View style={s.loadingStateCard}>
              <Text style={s.loadingStateText}>Loading transactions...</Text>
            </View>
          ) : finance.recentTransactions.length === 0 ? (
            <View style={s.emptyStateCard}>
              <Text style={s.emptyStateTitle}>No transactions yet</Text>
              <Text style={s.emptyStateBody}>Start tracking by adding your first expense or income.</Text>
            </View>
          ) : (
            finance.recentTransactions.map((tx) => {
              const visual = styleForCategory(tx.categoryName, tx.type === 'income');
              const amountLabel = `${tx.type === 'income' ? '+' : ''}${finance.formatCurrency(tx.amount)}`;

              return (
            <View key={tx.id} style={s.txItem}>
              <View style={[s.txIconWrapper, { backgroundColor: visual.iconBg }]}> 
                <Ionicons name={visual.icon} size={20} color={visual.iconColor} />
              </View>
              <View style={s.txInfo}>
                <Text style={s.txTitle}>{tx.title}</Text>
                <Text style={s.txCategory}>{tx.categoryName}</Text>
              </View>
              <View style={s.txRight}>
                <Text style={[s.txAmount, tx.type === 'income' && s.txAmountIncome]}>
                  {amountLabel}
                </Text>
                <Text style={s.txTime}>{tx.relativeDay}</Text>
              </View>
            </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Floating Action Button ────────────────────── */}
      <Pressable style={s.fab} onPress={handleAddPress}>
        <Ionicons name="add" size={32} color="#C8F560" />
      </Pressable>
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
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  txIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1E14',
    marginBottom: 4,
  },
  txCategory: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8F7C',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1E14',
    marginBottom: 4,
  },
  txAmountIncome: {
    color: '#51A351', // Bright green for income
  },
  txTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9DA28F',
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1E14',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});