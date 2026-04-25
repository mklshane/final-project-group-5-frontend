import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';

const HISTORY_KEY = 'budgy_notification_history_v1';
const SENT_KEY = 'budgy_notification_sent_v1';
const MAX_HISTORY = 50;

export type NotificationItemType =
  | 'budgetAlerts'
  | 'largeExpenseWarnings'
  | 'goalMilestones'
  | 'weeklyReport'
  | 'dailySummary';

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  type: NotificationItemType;
  firedAt: string;
}

interface SentState {
  budgets: Record<string, string>;
  goals: Record<string, string>;
  transactions: Record<string, true>;
  weeklyReportId?: string;
  dailySummaryId?: string;
}

const defaultSentState = (): SentState => ({
  budgets: {},
  goals: {},
  transactions: {},
});

async function loadSentState(): Promise<SentState> {
  try {
    const raw = await AsyncStorage.getItem(SENT_KEY);
    return raw ? { ...defaultSentState(), ...JSON.parse(raw) } : defaultSentState();
  } catch {
    return defaultSentState();
  }
}

async function saveSentState(state: SentState): Promise<void> {
  await AsyncStorage.setItem(SENT_KEY, JSON.stringify(state)).catch(() => undefined);
}

async function loadHistory(): Promise<NotificationHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function appendHistory(item: Omit<NotificationHistoryItem, 'id' | 'firedAt'>): Promise<void> {
  const history = await loadHistory();
  const entry: NotificationHistoryItem = {
    ...item,
    id: Date.now().toString(),
    firedAt: new Date().toISOString(),
  };
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated)).catch(() => undefined);
}

async function fireAndRecord(
  type: NotificationItemType,
  title: string,
  body: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
  await appendHistory({ type, title, body });
}

async function syncScheduled(
  weeklyReport: boolean,
  dailySummary: boolean,
  sent: SentState,
): Promise<SentState> {
  const next = { ...sent };

  if (weeklyReport && !sent.weeklyReportId) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly Finance Summary',
        body: 'Check this week\'s spending trends and budget progress in Budgy.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2, // Monday
        hour: 9,
        minute: 0,
      },
    });
    next.weeklyReportId = id;
  } else if (!weeklyReport && sent.weeklyReportId) {
    await Notifications.cancelScheduledNotificationAsync(sent.weeklyReportId).catch(() => undefined);
    next.weeklyReportId = undefined;
  }

  if (dailySummary && !sent.dailySummaryId) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Finance Check-in',
        body: 'Take a moment to log today\'s expenses and keep your budget on track.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });
    next.dailySummaryId = id;
  } else if (!dailySummary && sent.dailySummaryId) {
    await Notifications.cancelScheduledNotificationAsync(sent.dailySummaryId).catch(() => undefined);
    next.dailySummaryId = undefined;
  }

  return next;
}

export function useNotificationScheduler() {
  const { notifications: prefs } = useAppPreferences();
  const { state } = useFinanceData();
  const finance = useFinanceSelectors();

  const sentRef = useRef<SentState | null>(null);
  const [sentLoaded, setSentLoaded] = useState(false);

  // Load sent-state once from AsyncStorage
  useEffect(() => {
    if (Platform.OS === 'web') return;
    loadSentState().then((s) => {
      sentRef.current = s;
      setSentLoaded(true);
    });
  }, []);

  // Set handler + request permissions on mount (native only)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    Notifications.requestPermissionsAsync().catch(() => undefined);
  }, []);

  // Sync scheduled (weekly/daily) whenever prefs change or on first load
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!sentLoaded || !sentRef.current) return;

    syncScheduled(prefs.weeklyReport, prefs.dailySummary, sentRef.current)
      .then((next) => {
        sentRef.current = next;
        return saveSentState(next);
      })
      .catch(() => undefined);
  }, [sentLoaded, prefs.weeklyReport, prefs.dailySummary]);

  // Fire event-based notifications when finance data changes
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!sentLoaded || !sentRef.current) return;

    const sent = sentRef.current;
    const updates: Partial<SentState> = {};
    const fires: Promise<void>[] = [];

    // Budget alerts
    if (prefs.budgetAlerts) {
      for (const entry of finance.insights.budgetUtilization) {
        if (entry.percentage < 80) continue;
        const bucket = entry.overLimit ? '100' : '80';
        if (sent.budgets[entry.budget.id] === bucket) continue;

        fires.push(
          fireAndRecord(
            'budgetAlerts',
            entry.overLimit ? 'Budget exceeded' : `Budget ${entry.percentage}% used`,
            entry.overLimit
              ? `You've gone over your budget limit.`
              : `You've used ${entry.percentage}% of your budget limit.`,
          ),
        );
        if (!updates.budgets) updates.budgets = { ...sent.budgets };
        updates.budgets[entry.budget.id] = bucket;
      }
    }

    // Large expense warnings
    if (prefs.largeExpenseWarnings && finance.balances.total > 0) {
      const threshold = finance.balances.total * 0.15;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const tx of finance.allTransactions) {
        if (tx.type !== 'expense') continue;
        if (new Date(tx.date) < sevenDaysAgo) continue;
        if (tx.amount < threshold) continue;
        if (sent.transactions[tx.id]) continue;

        fires.push(
          fireAndRecord(
            'largeExpenseWarnings',
            'Large expense logged',
            `${finance.formatCurrency(tx.amount)} on "${tx.title}" — that's over 15% of your balance.`,
          ),
        );
        if (!updates.transactions) updates.transactions = { ...sent.transactions };
        updates.transactions[tx.id] = true;
      }
    }

    // Goal milestones
    if (prefs.goalMilestones) {
      for (const goal of finance.goals) {
        const pct =
          goal.target_amount > 0
            ? Math.min(100, (goal.saved_amount / goal.target_amount) * 100)
            : 0;

        const milestones = [25, 50, 75, 100] as const;
        for (const milestone of milestones) {
          if (pct < milestone) continue;
          if (sent.goals[goal.id] && Number(sent.goals[goal.id]) >= milestone) continue;

          fires.push(
            fireAndRecord(
              'goalMilestones',
              milestone === 100
                ? `"${goal.title}" goal reached!`
                : `"${goal.title}" is ${milestone}% complete`,
              milestone === 100
                ? `You saved ${finance.formatCurrency(goal.saved_amount)}. Goal complete!`
                : `${finance.formatCurrency(goal.saved_amount)} of ${finance.formatCurrency(goal.target_amount)} saved.`,
            ),
          );
          if (!updates.goals) updates.goals = { ...sent.goals };
          updates.goals[goal.id] = String(milestone);
          break;
        }
      }
    }

    if (fires.length === 0) return;

    const next: SentState = {
      ...sent,
      budgets: updates.budgets ?? sent.budgets,
      goals: updates.goals ?? sent.goals,
      transactions: updates.transactions ?? sent.transactions,
    };
    sentRef.current = next;

    Promise.all(fires)
      .then(() => saveSentState(next))
      .catch(() => undefined);
  }, [
    sentLoaded,
    state.transactions,
    state.budgets,
    state.goals,
    prefs.budgetAlerts,
    prefs.largeExpenseWarnings,
    prefs.goalMilestones,
  ]);
}
