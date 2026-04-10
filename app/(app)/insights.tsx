import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import AIInsightsCard from '@/components/Insights/AIInsightsCard';
import DonutChart from '@/components/Insights/DonutChart';
import SmartInsightsSection from '@/components/Insights/SmartInsightsSection';
import type { SmartInsight } from '@/components/Insights/SmartInsightsSection';
import type { FinanceSummary } from '@/lib/gemini';

type Period = 'week' | 'month' | '3months' | 'year';

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: '3months', label: '3 months' },
  { key: 'year', label: 'Year' },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Default colors for categories without a color
const SLICE_COLORS = ['#FF6B6B', '#FFAD5C', '#6BA3FF', '#B07BFF', '#8A8F7C', '#3DD97B', '#FF7EB3'];

function getPeriodRange(period: Period) {
  const now = new Date();

  if (period === 'week') {
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() + diffToMon);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const prevStart = new Date(weekStart);
    prevStart.setDate(weekStart.getDate() - 7);
    return { start: weekStart, end: weekEnd, prevStart, prevEnd: weekStart };
  }

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start, end, prevStart, prevEnd: start };
  }

  if (period === '3months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return { start, end, prevStart, prevEnd: start };
  }

  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const prevStart = new Date(now.getFullYear() - 1, 0, 1);
  return { start, end, prevStart, prevEnd: start };
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const finance = useFinanceSelectors();
  const { currencyCode } = useAppPreferences();
  const [period, setPeriod] = useState<Period>('month');

  const { start, end, prevStart, prevEnd } = useMemo(() => getPeriodRange(period), [period]);

  const periodTransactions = useMemo(
    () => finance.allTransactionsView.filter((tx) => {
      const d = new Date(tx.date);
      return d >= start && d < end;
    }),
    [finance.allTransactionsView, start, end]
  );

  const prevTransactions = useMemo(
    () => finance.allTransactionsView.filter((tx) => {
      const d = new Date(tx.date);
      return d >= prevStart && d < prevEnd;
    }),
    [finance.allTransactionsView, prevStart, prevEnd]
  );

  const spentTotal = useMemo(
    () => periodTransactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
    [periodTransactions]
  );
  const incomeTotal = useMemo(
    () => periodTransactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
    [periodTransactions]
  );
  const netFlow = incomeTotal - spentTotal;
  const txCount = periodTransactions.length;
  const avgTx = txCount > 0 ? (spentTotal + incomeTotal) / txCount : 0;

  const prevSpent = useMemo(
    () => prevTransactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
    [prevTransactions]
  );
  const prevIncome = useMemo(
    () => prevTransactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
    [prevTransactions]
  );

  const spentDiff = prevSpent > 0 ? Math.round(((spentTotal - prevSpent) / prevSpent) * 100) : null;
  const incomeDiff = prevIncome > 0 ? Math.round(((incomeTotal - prevIncome) / prevIncome) * 100) : null;

  // Bar chart — daily spending for the current week
  const barData = useMemo(() => {
    const day = new Date().getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(new Date().getDate() + diffToMon);

    return DAY_LABELS.map((label, i) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const total = finance.allTransactions
        .filter((tx) => {
          const d = new Date(tx.date);
          return tx.type === 'expense' && d >= dayStart && d < dayEnd;
        })
        .reduce((s, tx) => s + tx.amount, 0);

      return { label, total };
    });
  }, [finance.allTransactions]);

  const maxBar = useMemo(() => Math.max(...barData.map((b) => b.total), 1), [barData]);
  const todayDayIndex = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }, []);

  // Category breakdown for current period
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { label: string; total: number; color: string }>();
    for (const tx of periodTransactions) {
      if (tx.type !== 'expense') continue;
      const key = tx.categoryName ?? 'Uncategorized';
      const existing = map.get(key);
      map.set(key, {
        label: key,
        total: (existing?.total ?? 0) + tx.amount,
        color: (tx as any).categoryColor ?? '#8A8F7C',
      });
    }
    const grandTotal = [...map.values()].reduce((s, v) => s + v.total, 0);
    const sorted = [...map.entries()]
      .map(([, v], i) => ({
        ...v,
        color: v.color || SLICE_COLORS[i % SLICE_COLORS.length],
        percentage: grandTotal > 0 ? Math.round((v.total / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Merge tail into "Others"
    if (sorted.length > 5) {
      const top = sorted.slice(0, 4);
      const rest = sorted.slice(4);
      const othersTotal = rest.reduce((s, v) => s + v.total, 0);
      const othersPct = grandTotal > 0 ? Math.round((othersTotal / grandTotal) * 100) : 0;
      return [...top, { label: 'Others', total: othersTotal, percentage: othersPct, color: '#8A8F7C' }];
    }

    return sorted;
  }, [periodTransactions]);

  // Smart Insights — computed from data
  const smartInsights = useMemo<SmartInsight[]>(() => {
    const insights: SmartInsight[] = [];

    // 1. Top spending category vs prev period
    if (categoryBreakdown.length > 0) {
      const top = categoryBreakdown[0];
      const prevMap = new Map<string, number>();
      for (const tx of prevTransactions) {
        if (tx.type !== 'expense') continue;
        const key = (tx as any).categoryName ?? 'Uncategorized';
        prevMap.set(key, (prevMap.get(key) ?? 0) + tx.amount);
      }
      const prevTopTotal = prevMap.get(top.label) ?? 0;
      if (prevTopTotal > 0 && top.total !== prevTopTotal) {
        const diff = Math.round(((top.total - prevTopTotal) / prevTopTotal) * 100);
        const isDown = diff < 0;
        insights.push({
          icon: isDown ? 'trending-down' : 'trending-up',
          iconBg: isDown ? 'rgba(61,217,123,0.15)' : 'rgba(255,107,107,0.15)',
          iconColor: isDown ? theme.green : theme.red,
          boldText: `${top.label} spending is ${isDown ? 'down' : 'up'} ${Math.abs(diff)}%`,
          bodyText: `compared to last ${period === 'week' ? 'week' : period === 'month' ? 'month' : 'period'}.`,
        });
      } else if (top.total > 0) {
        insights.push({
          icon: 'pie-chart-outline',
          iconBg: 'rgba(200,245,96,0.12)',
          iconColor: theme.lime,
          boldText: `${top.label} is your top expense`,
          bodyText: `at ${top.percentage}% of total spending this period.`,
        });
      }
    }

    // 2. Budget alerts
    const overBudget = finance.insights.budgetUtilization.filter((b) => b.overLimit);
    const nearBudget = finance.insights.budgetUtilization.filter((b) => !b.overLimit && b.percentage >= 80);
    if (overBudget.length > 0) {
      insights.push({
        icon: 'warning-outline',
        iconBg: 'rgba(255,107,107,0.15)',
        iconColor: theme.red,
        boldText: `${overBudget.length} budget${overBudget.length > 1 ? 's' : ''} exceeded.`,
        bodyText: `Review your spending to get back on track.`,
      });
    } else if (nearBudget.length > 0) {
      const b = nearBudget[0];
      insights.push({
        icon: 'alert-circle-outline',
        iconBg: 'rgba(255,173,92,0.15)',
        iconColor: theme.orange,
        boldText: `A budget is at ${b.percentage}%.`,
        bodyText: `${finance.formatCurrency(b.remaining)} remaining. Watch your spending.`,
      });
    }

    // 3. Peak spend day of week
    const dayTotals = Array(7).fill(0) as number[];
    for (const tx of finance.allTransactions) {
      if (tx.type !== 'expense') continue;
      const d = new Date(tx.date).getDay(); // 0=Sun
      const idx = d === 0 ? 6 : d - 1;
      dayTotals[idx] += tx.amount;
    }
    const peakIdx = dayTotals.indexOf(Math.max(...dayTotals));
    const weekdayAvg = (dayTotals[0] + dayTotals[1] + dayTotals[2] + dayTotals[3] + dayTotals[4]) / 5;
    const weekendAvg = (dayTotals[5] + dayTotals[6]) / 2;
    if (dayTotals[peakIdx] > 0) {
      const multiplier = weekdayAvg > 0 ? (weekendAvg / weekdayAvg).toFixed(1) : null;
      insights.push({
        icon: 'bulb-outline',
        iconBg: 'rgba(200,245,96,0.12)',
        iconColor: theme.lime,
        boldText: `${DAY_LABELS[peakIdx]} is your peak spend day.`,
        bodyText: multiplier && Number(multiplier) > 1
          ? `Weekend spending is ${multiplier}x higher than weekdays.`
          : 'Plan ahead to manage your spending on this day.',
      });
    }

    // 4. Net flow status
    if (netFlow > 0 && incomeTotal > 0) {
      const savingRate = Math.round((netFlow / incomeTotal) * 100);
      if (savingRate >= 20) {
        insights.push({
          icon: 'checkmark-circle-outline',
          iconBg: 'rgba(61,217,123,0.15)',
          iconColor: theme.green,
          boldText: `Great job! You saved ${savingRate}%`,
          bodyText: `of your income this period. Keep it up!`,
        });
      }
    } else if (netFlow < 0) {
      insights.push({
        icon: 'alert-outline',
        iconBg: 'rgba(255,107,107,0.15)',
        iconColor: theme.red,
        boldText: `You spent more than you earned`,
        bodyText: `by ${finance.formatCurrency(Math.abs(netFlow))} this period. Consider cutting back.`,
      });
    }

    return insights.slice(0, 3);
  }, [categoryBreakdown, prevTransactions, finance, period, netFlow, incomeTotal, theme]);

  const now = new Date();
  const monthLabel = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const aiSummary: FinanceSummary = {
    currency: currencyCode,
    month: monthLabel,
    spentTotal: finance.month.spentTotal,
    incomeTotal: finance.month.incomeTotal,
    netFlow: finance.month.netFlow,
    totalWalletBalance: finance.balances.total,
    unsettledDebtsOwed: finance.debts.owedByUser,
    unsettledDebtsOwedToUser: finance.debts.owedToUser,
    categoryBreakdown: finance.insights.categoryBreakdown.slice(0, 5).map((c) => ({
      label: c.label,
      total: c.total,
      percentage: c.percentage,
    })),
    budgetUtilization: finance.insights.budgetUtilization.slice(0, 4).map((b) => ({
      category: 'Category',
      spent: b.spent,
      limit: b.budget.amount_limit,
      percentage: b.percentage,
      overLimit: b.overLimit,
    })),
  };

  const s = makeStyles(theme);
  const periodLabel = period === 'week' ? 'wk' : period === 'month' ? 'mo' : 'period';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Insights</Text>

        {/* Period tabs */}
        <View style={s.tabRow}>
          {PERIOD_LABELS.map(({ key, label }) => (
            <Pressable key={key} onPress={() => setPeriod(key)} style={[s.tab, period === key && s.tabActive]}>
              <Text style={[s.tabText, period === key && s.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* 2×2 stat grid */}
        <View style={s.grid}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>TOTAL SPENT</Text>
            <Text style={[s.statValue, { color: theme.red }]}>{finance.formatCurrency(spentTotal)}</Text>
            {spentDiff !== null ? (
              <View style={s.diffRow}>
                <Ionicons name={spentDiff >= 0 ? 'arrow-up' : 'arrow-down'} size={11} color={spentDiff >= 0 ? theme.red : theme.green} />
                <Text style={[s.diffText, { color: spentDiff >= 0 ? theme.red : theme.green }]}>
                  {Math.abs(spentDiff)}% vs last {periodLabel}
                </Text>
              </View>
            ) : (
              <Text style={s.diffNeutral}>No prior data</Text>
            )}
          </View>

          <View style={s.statCard}>
            <Text style={s.statLabel}>TOTAL INCOME</Text>
            <Text style={[s.statValue, { color: theme.green }]}>{finance.formatCurrency(incomeTotal)}</Text>
            {incomeDiff !== null ? (
              <View style={s.diffRow}>
                <Ionicons name={incomeDiff >= 0 ? 'arrow-up' : 'arrow-down'} size={11} color={incomeDiff >= 0 ? theme.green : theme.red} />
                <Text style={[s.diffText, { color: incomeDiff >= 0 ? theme.green : theme.red }]}>
                  {Math.abs(incomeDiff)}% vs last {periodLabel}
                </Text>
              </View>
            ) : (
              <Text style={s.diffNeutral}>Same as last mo</Text>
            )}
          </View>

          <View style={s.statCard}>
            <Text style={s.statLabel}>NET FLOW</Text>
            <Text style={[s.statValue, { color: netFlow >= 0 ? theme.lime : theme.red }]}>
              {netFlow >= 0 ? '+' : ''}{finance.formatCurrency(netFlow)}
            </Text>
            <View style={s.diffRow}>
              <Ionicons name={netFlow >= 0 ? 'trending-up' : 'trending-down'} size={11} color={netFlow >= 0 ? theme.lime : theme.red} />
              <Text style={[s.diffText, { color: netFlow >= 0 ? theme.lime : theme.red }]}>
                {netFlow >= 0 ? 'Saving well' : 'Overspending'}
              </Text>
            </View>
          </View>

          <View style={s.statCard}>
            <Text style={s.statLabel}>TRANSACTIONS</Text>
            <Text style={[s.statValue, { color: theme.text }]}>{txCount}</Text>
            <Text style={s.diffNeutral}>
              {txCount > 0 ? `Avg ${finance.formatCurrency(avgTx)} each` : 'No transactions'}
            </Text>
          </View>
        </View>

        {/* Spending this week bar chart */}
        <View style={s.card}>
          <Text style={s.cardLabel}>SPENDING THIS WEEK</Text>
          <View style={s.barChart}>
            {barData.map((bar, i) => {
              const heightPct = bar.total / maxBar;
              const isToday = i === todayDayIndex;
              return (
                <View key={bar.label} style={s.barCol}>
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.barFill,
                        {
                          height: `${Math.max(heightPct * 100, bar.total > 0 ? 8 : 0)}%`,
                          backgroundColor: isToday ? theme.lime : (theme.isDark ? '#2C3122' : '#DDE1CF'),
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.barDayLabel, isToday && { color: theme.lime, fontWeight: '700' }]}>
                    {bar.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Where your money goes — donut + legend */}
        <View style={s.card}>
          <Text style={s.cardLabel}>WHERE YOUR MONEY GOES</Text>
          {categoryBreakdown.length === 0 ? (
            <Text style={s.emptyText}>No expense data for this period.</Text>
          ) : (
            <View style={s.donutRow}>
              <DonutChart
                data={categoryBreakdown.map((c) => ({ label: c.label, percentage: c.percentage, color: c.color }))}
                size={130}
                strokeWidth={26}
              />
              <View style={s.legend}>
                {categoryBreakdown.map((entry) => (
                  <View key={entry.label} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: entry.color }]} />
                    <Text style={s.legendLabel} numberOfLines={1}>{entry.label}</Text>
                    <Text style={s.legendPct}>{entry.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Smart Insights */}
        <SmartInsightsSection insights={smartInsights} />

        {/* AI Insights */}
        <AIInsightsCard summary={aiSummary} />

      </ScrollView>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
    title: { fontSize: 30, fontWeight: '800', color: theme.text, letterSpacing: -0.8, marginTop: 4, marginBottom: 2 },

    // Tabs
    tabRow: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 14, padding: 4, gap: 2 },
    tab: { flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: theme.lime },
    tabText: { fontSize: 12, fontWeight: '600', color: theme.secondary },
    tabTextActive: { color: '#1A1E14', fontWeight: '700' },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { width: '47.5%', backgroundColor: theme.surface, borderRadius: 18, padding: 14, gap: 3 },
    statLabel: { fontSize: 9, fontWeight: '800', color: theme.secondary, letterSpacing: 1.2 },
    statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
    diffRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
    diffText: { fontSize: 11, fontWeight: '600' },
    diffNeutral: { fontSize: 11, fontWeight: '500', color: theme.secondary, marginTop: 1 },

    // Card shell
    card: { backgroundColor: theme.surface, borderRadius: 20, padding: 16, gap: 12 },
    cardLabel: { fontSize: 9, fontWeight: '800', color: theme.secondary, letterSpacing: 1.4 },
    emptyText: { fontSize: 13, color: theme.secondary, fontWeight: '500' },

    // Bar chart
    barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6 },
    barCol: { flex: 1, alignItems: 'center', height: '100%', gap: 5 },
    barTrack: {
      flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden',
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,30,20,0.06)',
    },
    barFill: { width: '100%', borderRadius: 6 },
    barDayLabel: { fontSize: 9, fontWeight: '600', color: theme.secondary },

    // Donut
    donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    legend: { flex: 1, gap: 8 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    legendLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: theme.text },
    legendPct: { fontSize: 13, fontWeight: '700', color: theme.secondary },
  });
}
