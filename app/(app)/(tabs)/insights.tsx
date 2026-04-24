import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import AIInsightsCard from '@/components/Insights/AIInsightsCard';
import SmartInsightsSection from '@/components/Insights/SmartInsightsSection';
import type { SmartInsight } from '@/components/Insights/SmartInsightsSection';
import type { FinanceSummary } from '@/lib/gemini';
import InsightsHeader from '@/components/Insights/InsightsHeader';
import PeriodNavigator from '@/components/Insights/PeriodNavigator';
import StatsGrid from '@/components/Insights/StatsGrid';
import SpendingThisWeek from '@/components/Insights/SpendingThisWeek';
import CategoryBreakdown from '@/components/Insights/CategoryBreakdown';

type Period = 'day' | 'week' | 'month' | 'year';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Default colors for categories without a color
const SLICE_COLORS = ['#FF6B6B', '#FFAD5C', '#6BA3FF', '#B07BFF', '#8A8F7C', '#3DD97B', '#FF7EB3'];

function getDefaultAnchor(period: Period): Date {
  const now = new Date();
  if (period === 'day') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'week') {
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() + diffToMon);
    return weekStart;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

function stepAnchor(period: Period, anchor: Date, dir: 1 | -1): Date {
  if (period === 'day') {
    const d = new Date(anchor);
    d.setDate(d.getDate() + dir);
    return d;
  }
  if (period === 'week') {
    const d = new Date(anchor);
    d.setDate(d.getDate() + dir * 7);
    return d;
  }
  if (period === 'month') {
    return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
  }
  return new Date(anchor.getFullYear() + dir, 0, 1);
}

function getPeriodRange(period: Period, anchor: Date) {
  if (period === 'day') {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const prevStart = new Date(start);
    prevStart.setDate(start.getDate() - 1);
    return { start, end, prevStart, prevEnd: start };
  }

  if (period === 'week') {
    const weekStart = new Date(anchor);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const prevStart = new Date(weekStart);
    prevStart.setDate(weekStart.getDate() - 7);
    return { start: weekStart, end: weekEnd, prevStart, prevEnd: weekStart };
  }

  if (period === 'month') {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    const prevStart = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
    return { start, end, prevStart, prevEnd: start };
  }

  const start = new Date(anchor.getFullYear(), 0, 1);
  const end = new Date(anchor.getFullYear() + 1, 0, 1);
  const prevStart = new Date(anchor.getFullYear() - 1, 0, 1);
  return { start, end, prevStart, prevEnd: start };
}

function formatAnchorLabel(period: Period, anchor: Date): string {
  const now = new Date();
  if (period === 'day') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (anchor.getTime() === today.getTime()) return 'Today';
    if (anchor.getTime() === yesterday.getTime()) return 'Yesterday';
    return anchor.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: anchor.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }
  if (period === 'week') {
    const weekEnd = new Date(anchor);
    weekEnd.setDate(anchor.getDate() + 6);
    const startStr = anchor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}`;
  }
  if (period === 'month') {
    return anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  return String(anchor.getFullYear());
}

function isFutureAnchor(period: Period, anchor: Date): boolean {
  const now = new Date();
  if (period === 'day') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return anchor >= today;
  }
  if (period === 'week') {
    const thisWeekStart = getDefaultAnchor('week');
    return anchor >= thisWeekStart;
  }
  if (period === 'month') {
    return anchor.getFullYear() === now.getFullYear() && anchor.getMonth() >= now.getMonth();
  }
  return anchor.getFullYear() >= now.getFullYear();
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const finance = useFinanceSelectors();
  const { currencyCode } = useAppPreferences();
  const [period, setPeriod] = useState<Period>('month');
  const [anchor, setAnchor] = useState<Date>(() => getDefaultAnchor('month'));

  function handleSetPeriod(p: Period) {
    setPeriod(p);
    setAnchor(getDefaultAnchor(p));
  }

  const { start, end, prevStart, prevEnd } = useMemo(() => getPeriodRange(period, anchor), [period, anchor]);

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

  // Period-aware spending trend chart
  const trendChart = useMemo(() => {
    const now = new Date();
    const expenses = finance.allTransactionsView.filter((tx) => tx.type === 'expense');

    if (period === 'day') {
      const labels = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM'];
      const totals = Array(labels.length).fill(0) as number[];
      const dayStart = new Date(anchor);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      for (const tx of expenses) {
        const d = new Date(tx.date);
        if (d < dayStart || d >= dayEnd) continue;
        // date-only strings (e.g. "2026-04-24") are parsed as UTC midnight,
        // which becomes 8 AM in UTC+8. Use created_at for the hour instead.
        const timeSource = tx.date.includes('T') ? d : (tx.created_at ? new Date(tx.created_at) : d);
        const bucket = Math.floor(timeSource.getHours() / 4);
        totals[Math.min(Math.max(bucket, 0), 5)] += tx.amount;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const highlightIndex = dayStart.getTime() === today.getTime() ? Math.floor(now.getHours() / 4) : -1;
      const points = labels.map((label, i) => ({ label, total: totals[i] }));

      return {
        title: 'SPENDING TREND · DAY (4H)',
        points,
        maxValue: Math.max(...totals, 1),
        highlightIndex,
      };
    }

    if (period === 'week') {
      const labels = DAY_LABELS;
      const totals = Array(labels.length).fill(0) as number[];
      const weekStart = new Date(anchor);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      for (const tx of expenses) {
        const d = new Date(tx.date);
        if (d < weekStart || d >= weekEnd) continue;
        const idx = Math.floor((d.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
        if (idx >= 0 && idx < totals.length) totals[idx] += tx.amount;
      }

      const thisWeekStart = getDefaultAnchor('week');
      const highlightIndex = weekStart.getTime() === thisWeekStart.getTime() ? (now.getDay() === 0 ? 6 : now.getDay() - 1) : -1;
      const points = labels.map((label, i) => ({ label, total: totals[i] }));

      return {
        title: 'SPENDING TREND · WEEK',
        points,
        maxValue: Math.max(...totals, 1),
        highlightIndex,
      };
    }

    if (period === 'month') {
      const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
      const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
      const bucketCount = Math.ceil(daysInMonth / 7);
      const totals = Array(bucketCount).fill(0) as number[];

      for (const tx of expenses) {
        const d = new Date(tx.date);
        if (d < monthStart || d >= monthEnd) continue;
        const bucket = Math.floor((d.getDate() - 1) / 7);
        totals[bucket] += tx.amount;
      }

      const points = totals.map((total, i) => ({ label: `W${i + 1}`, total }));
      const isCurrentMonth = anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth();
      const highlightIndex = isCurrentMonth ? Math.floor((now.getDate() - 1) / 7) : -1;

      return {
        title: 'SPENDING TREND · MONTH',
        points,
        maxValue: Math.max(...totals, 1),
        highlightIndex,
      };
    }

    const totals = Array(12).fill(0) as number[];
    const yearStart = new Date(anchor.getFullYear(), 0, 1);
    const yearEnd = new Date(anchor.getFullYear() + 1, 0, 1);

    for (const tx of expenses) {
      const d = new Date(tx.date);
      if (d < yearStart || d >= yearEnd) continue;
      totals[d.getMonth()] += tx.amount;
    }

    const points = totals.map((total, i) => ({
      label: new Date(anchor.getFullYear(), i, 1).toLocaleDateString(undefined, { month: 'short' }),
      total,
    }));
    const highlightIndex = anchor.getFullYear() === now.getFullYear() ? now.getMonth() : -1;

    return {
      title: 'SPENDING TREND · YEAR',
      points,
      maxValue: Math.max(...totals, 1),
      highlightIndex,
    };
  }, [anchor, finance.allTransactionsView, period]);

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
          bodyText: `compared to last ${period === 'day' ? 'day' : period === 'week' ? 'week' : period === 'month' ? 'month' : 'year'}.`,
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
  const periodLabel = period === 'day' ? 'day' : period === 'week' ? 'wk' : period === 'month' ? 'mo' : 'yr';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <InsightsHeader period={period} onSetPeriod={handleSetPeriod} />

        <PeriodNavigator
          period={period}
          anchor={anchor}
          onSetAnchor={setAnchor}
          formatAnchorLabel={formatAnchorLabel}
          isFutureAnchor={isFutureAnchor}
          stepAnchor={stepAnchor}
        />

        <StatsGrid
          spentTotal={spentTotal}
          incomeTotal={incomeTotal}
          netFlow={netFlow}
          txCount={txCount}
          avgTx={avgTx}
          spentDiff={spentDiff}
          incomeDiff={incomeDiff}
          periodLabel={periodLabel}
        />

        <SpendingThisWeek
          title={trendChart.title}
          points={trendChart.points}
          maxValue={trendChart.maxValue}
          highlightIndex={trendChart.highlightIndex}
        />

        <CategoryBreakdown data={categoryBreakdown} />

        <SmartInsightsSection insights={smartInsights} />

        <AIInsightsCard summary={aiSummary} />
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  });
}
