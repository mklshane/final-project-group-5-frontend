import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIFICATION_HISTORY_KEY = 'budgy_notification_history_v1';
const MAX_HISTORY = 50;

export type NotificationItemType =
  | 'budgetAlerts'
  | 'largeExpenseWarnings'
  | 'goalMilestones'
  | 'weeklyReport'
  | 'dailySummary'
  | 'inAppSuccess'
  | 'inAppError'
  | 'inAppInfo';

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  type: NotificationItemType;
  firedAt: string;
  source: 'system' | 'inApp';
}

const IN_APP_TYPES: NotificationItemType[] = ['inAppSuccess', 'inAppError', 'inAppInfo'];

function inferSource(type: NotificationItemType): 'system' | 'inApp' {
  return IN_APP_TYPES.includes(type) ? 'inApp' : 'system';
}

export async function loadNotificationHistory(): Promise<NotificationHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Array<Partial<NotificationHistoryItem>>;
    return parsed
      .filter((item): item is Partial<NotificationHistoryItem> & Pick<NotificationHistoryItem, 'title' | 'body' | 'type' | 'firedAt'> =>
        typeof item?.title === 'string'
        && typeof item?.body === 'string'
        && typeof item?.type === 'string'
        && typeof item?.firedAt === 'string')
      .map((item, index) => ({
        id: item.id ?? `${item.firedAt}-${index}`,
        title: item.title,
        body: item.body,
        type: item.type as NotificationItemType,
        firedAt: item.firedAt,
        source: item.source ?? inferSource(item.type as NotificationItemType),
      }));
  } catch {
    return [];
  }
}

export async function appendNotificationHistory(
  item: Omit<NotificationHistoryItem, 'id' | 'firedAt'>,
): Promise<void> {
  const history = await loadNotificationHistory();
  const entry: NotificationHistoryItem = {
    ...item,
    id: Date.now().toString(),
    firedAt: new Date().toISOString(),
  };
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated)).catch(() => undefined);
}
