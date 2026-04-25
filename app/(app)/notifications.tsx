import { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import type { CategoryRecord } from '@/types/finance';

interface AppAlert {
  id: string;
  severity: 'warning' | 'info' | 'milestone';
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  yearly: 'annual',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { state } = useFinanceData();
  const finance = useFinanceSelectors();
  const { notifications: prefs } = useAppPreferences();

  const categoriesById = useMemo(() => {
    const map = new Map<string, CategoryRecord>();
    for (const cat of state.categories) {
      if (!cat.deleted_at) map.set(cat.id, cat);
    }
    return map;
  }, [state.categories]);

  const alerts = useMemo<AppAlert[]>(() => {
    const result: AppAlert[] = [];

    // Budget alerts
    if (prefs.budgetAlerts) {
      for (const entry of finance.insights.budgetUtilization) {
        if (entry.percentage < 80) continue;
        const cat = categoriesById.get(entry.budget.category_id);
        const name = cat?.name ?? 'Budget';
        const pct = Math.round(entry.percentage);
        const periodLabel = PERIOD_LABELS[entry.budget.period] ?? entry.budget.period;

        if (entry.overLimit) {
          result.push({
            id: `budget-over-${entry.budget.id}`,
            severity: 'warning',
            title: `${name} budget exceeded`,
            body: `You spent ${finance.formatCurrency(entry.spent)} against your ${finance.formatCurrency(entry.budget.amount_limit)} ${periodLabel} limit.`,
            icon: 'warning',
            iconColor: theme.red,
          });
        } else {
          result.push({
            id: `budget-near-${entry.budget.id}`,
            severity: 'warning',
            title: `${name} budget is ${pct}% used`,
            body: `${finance.formatCurrency(entry.remaining)} remaining of your ${periodLabel} limit.`,
            icon: 'alert-circle',
            iconColor: theme.orange,
          });
        }
      }
    }

    // Large expense warnings
    if (prefs.largeExpenseWarnings && finance.balances.total > 0) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const threshold = finance.balances.total * 0.15;

      const largeExpenses = finance.allTransactionsView
        .filter((tx) => tx.type === 'expense' && new Date(tx.date) >= sevenDaysAgo && tx.amount >= threshold)
        .slice(0, 3);

      for (const tx of largeExpenses) {
        result.push({
          id: `large-expense-${tx.id}`,
          severity: 'warning',
          title: 'Large expense logged',
          body: `${finance.formatCurrency(tx.amount)} on "${tx.title}" — ${tx.relativeDay}.`,
          icon: 'trending-up',
          iconColor: theme.red,
        });
      }
    }

    // Goal milestones
    if (prefs.goalMilestones) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const goal of finance.goals) {
        const pct =
          goal.target_amount > 0
            ? Math.min(100, (goal.saved_amount / goal.target_amount) * 100)
            : 0;

        const milestones = [25, 50, 75, 100] as const;
        for (const milestone of milestones) {
          const upper = milestone === 100 ? 101 : milestone + 25;
          if (pct >= milestone && pct < upper) {
            const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
            result.push({
              id: `goal-milestone-${goal.id}-${milestone}`,
              severity: milestone === 100 ? 'milestone' : 'info',
              title: milestone === 100 ? `"${goal.title}" goal reached!` : `"${goal.title}" is ${milestone}% complete`,
              body:
                milestone === 100
                  ? `You saved ${finance.formatCurrency(goal.saved_amount)}. Goal complete!`
                  : `${finance.formatCurrency(goal.saved_amount)} saved of ${finance.formatCurrency(goal.target_amount)}. ${finance.formatCurrency(remaining)} to go.`,
              icon: milestone === 100 ? 'trophy' : 'flag',
              iconColor: milestone === 100 ? theme.green : theme.blue,
            });
            break;
          }
        }

        // Deadline within 7 days
        if (goal.deadline) {
          const deadline = new Date(goal.deadline);
          deadline.setHours(0, 0, 0, 0);
          const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft >= 0 && daysLeft <= 7) {
            const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
            result.push({
              id: `goal-deadline-${goal.id}`,
              severity: 'warning',
              title: `"${goal.title}" deadline ${daysLeft === 0 ? 'is today' : `in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}`,
              body:
                remaining > 0
                  ? `${finance.formatCurrency(remaining)} still needed to reach your target.`
                  : 'You\'ve reached your target amount — great work!',
              icon: 'time',
              iconColor: theme.orange,
            });
          }
        }
      }
    }

    // Weekly report — no activity this week
    if (prefs.weeklyReport) {
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      const dayOfWeek = (weekStart.getDay() + 6) % 7; // Monday = 0
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      const hasActivity = finance.allTransactions.some((tx) => new Date(tx.date) >= weekStart);
      if (!hasActivity) {
        result.push({
          id: 'weekly-no-activity',
          severity: 'info',
          title: 'No activity this week',
          body: 'No transactions logged since Monday. Keeping records up to date helps with insights.',
          icon: 'calendar-outline',
          iconColor: theme.secondary,
        });
      }
    }

    // Sort: warning → info → milestone
    const order: Record<AppAlert['severity'], number> = { warning: 0, info: 1, milestone: 2 };
    return result.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [finance, prefs, categoriesById, theme]);

  const severityBg = (severity: AppAlert['severity']) => {
    if (severity === 'warning') return theme.isDark ? 'rgba(230,108,106,0.10)' : 'rgba(230,108,106,0.07)';
    if (severity === 'milestone') return theme.isDark ? 'rgba(72,184,108,0.10)' : 'rgba(72,184,108,0.07)';
    return theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
      {/* Custom header */}
      <View style={[s.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[s.headerTitle, { color: theme.text }]}>Notifications</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {alerts.length === 0 ? (
          <View style={s.emptyWrap}>
            <View style={[s.emptyIconWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Ionicons name="notifications-outline" size={32} color={theme.tertiary} />
            </View>
            <Text style={[s.emptyTitle, { color: theme.text }]}>All clear</Text>
            <Text style={[s.emptyBody, { color: theme.secondary }]}>
              No alerts right now. Keep logging transactions and we'll surface budget warnings, goal milestones, and more here.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[s.sectionLabel, { color: theme.secondary }]}>ALERTS</Text>
            {alerts.map((alert) => (
              <View
                key={alert.id}
                style={[s.alertCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={[s.alertIconWrap, { backgroundColor: severityBg(alert.severity) }]}>
                  <Ionicons name={alert.icon} size={20} color={alert.iconColor} />
                </View>
                <View style={s.alertBody}>
                  <Text style={[s.alertTitle, { color: theme.text }]}>{alert.title}</Text>
                  <Text style={[s.alertDesc, { color: theme.secondary }]}>{alert.body}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 52,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 36,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingLeft: 2,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertBody: {
    flex: 1,
    minWidth: 0,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
    lineHeight: 19,
  },
  alertDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
});
