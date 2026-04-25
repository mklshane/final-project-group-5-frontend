import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import type { NotificationHistoryItem, NotificationItemType } from '@/hooks/useNotificationScheduler';
import type { CategoryRecord } from '@/types/finance';

const HISTORY_KEY = 'budgy_notification_history_v1';

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

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const TYPE_META: Record<
  NotificationItemType,
  { icon: keyof typeof Ionicons.glyphMap; color: (t: ReturnType<typeof useTheme>) => string }
> = {
  budgetAlerts: { icon: 'pie-chart', color: (t) => t.orange },
  largeExpenseWarnings: { icon: 'trending-up', color: (t) => t.red },
  goalMilestones: { icon: 'trophy', color: (t) => t.green },
  weeklyReport: { icon: 'calendar-outline', color: (t) => t.blue },
  dailySummary: { icon: 'sunny-outline', color: (t) => '#F4A018' },
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const { state } = useFinanceData();
  const finance = useFinanceSelectors();
  const { notifications: prefs } = useAppPreferences();

  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [permDenied, setPermDenied] = useState(false);

  // Reload history every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(HISTORY_KEY)
        .then((raw) => setHistory(raw ? JSON.parse(raw) : []))
        .catch(() => undefined);
    }, []),
  );

  // Check notification permission status
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Notifications.getPermissionsAsync()
      .then(({ status }) => setPermDenied(status === 'denied'))
      .catch(() => undefined);
  }, []);

  const categoriesById = useMemo(() => {
    const map = new Map<string, CategoryRecord>();
    for (const cat of state.categories) {
      if (!cat.deleted_at) map.set(cat.id, cat);
    }
    return map;
  }, [state.categories]);

  const alerts = useMemo<AppAlert[]>(() => {
    const result: AppAlert[] = [];

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

    if (prefs.goalMilestones) {
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

        if (goal.deadline) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
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
                  : "You've reached your target amount — great work!",
              icon: 'time',
              iconColor: theme.orange,
            });
          }
        }
      }
    }

    if (prefs.weeklyReport) {
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      const dayOfWeek = (weekStart.getDay() + 6) % 7;
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

    const order: Record<AppAlert['severity'], number> = { warning: 0, info: 1, milestone: 2 };
    return result.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [finance, prefs, categoriesById, theme]);

  const isEmpty = history.length === 0 && alerts.length === 0;

  const alertBg = (severity: AppAlert['severity']) => {
    if (severity === 'warning') return theme.isDark ? 'rgba(230,108,106,0.10)' : 'rgba(230,108,106,0.07)';
    if (severity === 'milestone') return theme.isDark ? 'rgba(72,184,108,0.10)' : 'rgba(72,184,108,0.07)';
    return theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Page title */}
        <View style={s.pageHeader}>
          <Text style={[s.pageTitle, { color: theme.text }]}>Your Notifications</Text>
          <Text style={[s.pageSubtitle, { color: theme.secondary }]}>
            Alerts, milestones, and spending reminders.
          </Text>
        </View>

        {/* Permission denied banner */}
        {permDenied && (
          <Pressable
            style={[s.permBanner, { backgroundColor: theme.isDark ? 'rgba(230,108,106,0.12)' : 'rgba(230,108,106,0.08)', borderColor: theme.red }]}
            onPress={() => Linking.openSettings()}
          >
            <Ionicons name="notifications-off-outline" size={18} color={theme.red} />
            <Text style={[s.permBannerText, { color: theme.red }]}>
              Notifications are blocked. Tap to open Settings and enable them.
            </Text>
          </Pressable>
        )}

        {/* Recent notification history */}
        {history.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: theme.secondary }]}>RECENT</Text>
            {history.map((item) => {
              const meta = TYPE_META[item.type] ?? TYPE_META.weeklyReport;
              const color = meta.color(theme);
              return (
                <View
                  key={item.id}
                  style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={[s.iconWrap, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                    <Ionicons name={meta.icon} size={20} color={color} />
                  </View>
                  <View style={s.cardBody}>
                    <Text style={[s.cardTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[s.cardDesc, { color: theme.secondary }]}>{item.body}</Text>
                    <Text style={[s.cardTime, { color: theme.tertiary ?? theme.secondary }]}>
                      {relativeTime(item.firedAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Smart alerts */}
        {alerts.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: theme.secondary, marginTop: history.length > 0 ? 20 : 0 }]}>
              SMART ALERTS
            </Text>
            {alerts.map((alert) => (
              <View
                key={alert.id}
                style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={[s.iconWrap, { backgroundColor: alertBg(alert.severity) }]}>
                  <Ionicons name={alert.icon} size={20} color={alert.iconColor} />
                </View>
                <View style={s.cardBody}>
                  <Text style={[s.cardTitle, { color: theme.text }]}>{alert.title}</Text>
                  <Text style={[s.cardDesc, { color: theme.secondary }]}>{alert.body}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty state */}
        {isEmpty && (
          <View style={s.emptyWrap}>
            <View style={[s.emptyIconBox, { backgroundColor: theme.surfaceAlt ?? theme.surface, borderColor: theme.border }]}>
              <Ionicons name="notifications-outline" size={32} color={theme.tertiary ?? theme.secondary} />
            </View>
            <Text style={[s.emptyTitle, { color: theme.text }]}>All clear</Text>
            <Text style={[s.emptyBody, { color: theme.secondary }]}>
              No alerts right now. Budget warnings, goal milestones, and spending reminders will appear here.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
  },
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  permBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingLeft: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
    lineHeight: 19,
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
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
