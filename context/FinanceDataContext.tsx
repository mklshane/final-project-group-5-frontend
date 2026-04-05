import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type {
  BudgetRecord,
  CategoryRecord,
  DebtRecord,
  GoalRecord,
  SyncChange,
  SyncResponse,
  TransactionRecord,
} from '@/types/finance';

interface FinanceDataState {
  transactions: TransactionRecord[];
  categories: CategoryRecord[];
  budgets: BudgetRecord[];
  goals: GoalRecord[];
  debts: DebtRecord[];
  pendingChanges: SyncChange[];
  lastSyncedAt: string | null;
}

interface AddTransactionInput {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId?: string | null;
  date?: string;
  note?: string;
}

interface FinanceDataContextValue {
  state: FinanceDataState;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  syncNow: () => Promise<void>;
  addTransaction: (input: AddTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const FinanceDataContext = createContext<FinanceDataContextValue | null>(null);
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const STORAGE_KEY_PREFIX = 'budgy_finance_data_v1';

const defaultFinanceState: FinanceDataState = {
  transactions: [],
  categories: [],
  budgets: [],
  goals: [],
  debts: [],
  pendingChanges: [],
  lastSyncedAt: null,
};

const storageKeyForUser = (userId: string) => `${STORAGE_KEY_PREFIX}:${userId}`;

const createId = () => `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

const nowIso = () => new Date().toISOString();

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toTransaction = (record: Record<string, unknown>): TransactionRecord => ({
  id: String(record.id),
  user_id: record.user_id ? String(record.user_id) : undefined,
  type: record.type === 'income' ? 'income' : 'expense',
  amount: toNumber(record.amount),
  title: String(record.title ?? 'Untitled'),
  category_id: record.category_id ? String(record.category_id) : null,
  date: String(record.date ?? nowIso()),
  note: record.note ? String(record.note) : null,
  is_recurring: Boolean(record.is_recurring),
  recurring_interval: record.recurring_interval ? String(record.recurring_interval) : null,
  version: toNumber(record.version, 1),
  created_at: record.created_at ? String(record.created_at) : undefined,
  updated_at: record.updated_at ? String(record.updated_at) : undefined,
  deleted_at: record.deleted_at ? String(record.deleted_at) : null,
});

const toCategory = (record: Record<string, unknown>): CategoryRecord => ({
  id: String(record.id),
  user_id: record.user_id ? String(record.user_id) : undefined,
  name: String(record.name ?? 'Uncategorized'),
  icon: record.icon ? String(record.icon) : null,
  color: record.color ? String(record.color) : null,
  type: record.type === 'income' || record.type === 'both' ? record.type : 'expense',
  is_default: Boolean(record.is_default),
  sort_order: toNumber(record.sort_order, 0),
  version: toNumber(record.version, 1),
  created_at: record.created_at ? String(record.created_at) : undefined,
  updated_at: record.updated_at ? String(record.updated_at) : undefined,
  deleted_at: record.deleted_at ? String(record.deleted_at) : null,
});

const toBudget = (record: Record<string, unknown>): BudgetRecord => ({
  id: String(record.id),
  user_id: record.user_id ? String(record.user_id) : undefined,
  category_id: String(record.category_id ?? ''),
  amount_limit: toNumber(record.amount_limit),
  period: record.period === 'weekly' ? 'weekly' : 'monthly',
  alert_threshold: toNumber(record.alert_threshold, 80),
  version: toNumber(record.version, 1),
  created_at: record.created_at ? String(record.created_at) : undefined,
  updated_at: record.updated_at ? String(record.updated_at) : undefined,
  deleted_at: record.deleted_at ? String(record.deleted_at) : null,
});

const toGoal = (record: Record<string, unknown>): GoalRecord => ({
  id: String(record.id),
  user_id: record.user_id ? String(record.user_id) : undefined,
  title: String(record.title ?? 'Goal'),
  target_amount: toNumber(record.target_amount),
  saved_amount: toNumber(record.saved_amount),
  deadline: record.deadline ? String(record.deadline) : null,
  version: toNumber(record.version, 1),
  created_at: record.created_at ? String(record.created_at) : undefined,
  updated_at: record.updated_at ? String(record.updated_at) : undefined,
  deleted_at: record.deleted_at ? String(record.deleted_at) : null,
});

const toDebt = (record: Record<string, unknown>): DebtRecord => ({
  id: String(record.id),
  user_id: record.user_id ? String(record.user_id) : undefined,
  person_name: String(record.person_name ?? 'Unknown'),
  amount: toNumber(record.amount),
  type: record.type === 'owed' ? 'owed' : 'owe',
  description: record.description ? String(record.description) : null,
  is_settled: Boolean(record.is_settled),
  settled_at: record.settled_at ? String(record.settled_at) : null,
  version: toNumber(record.version, 1),
  created_at: record.created_at ? String(record.created_at) : undefined,
  updated_at: record.updated_at ? String(record.updated_at) : undefined,
  deleted_at: record.deleted_at ? String(record.deleted_at) : null,
});

const upsertById = <T extends { id: string; deleted_at?: string | null }>(list: T[], item: T): T[] => {
  if (item.deleted_at) {
    return list.filter((current) => current.id !== item.id);
  }

  const index = list.findIndex((current) => current.id === item.id);
  if (index === -1) return [item, ...list];

  const copy = [...list];
  copy[index] = item;
  return copy;
};

const applyServerChange = (state: FinanceDataState, change: SyncChange): FinanceDataState => {
  if (!change.record) {
    if (change.action !== 'delete' || !change.record_id) return state;

    if (change.table === 'transactions') {
      return { ...state, transactions: state.transactions.filter((t) => t.id !== change.record_id) };
    }
    if (change.table === 'categories') {
      return { ...state, categories: state.categories.filter((c) => c.id !== change.record_id) };
    }
    if (change.table === 'budgets') {
      return { ...state, budgets: state.budgets.filter((b) => b.id !== change.record_id) };
    }
    if (change.table === 'goals') {
      return { ...state, goals: state.goals.filter((g) => g.id !== change.record_id) };
    }

    return { ...state, debts: state.debts.filter((d) => d.id !== change.record_id) };
  }

  if (change.table === 'transactions') {
    return { ...state, transactions: upsertById(state.transactions, toTransaction(change.record)) };
  }
  if (change.table === 'categories') {
    return { ...state, categories: upsertById(state.categories, toCategory(change.record)) };
  }
  if (change.table === 'budgets') {
    return { ...state, budgets: upsertById(state.budgets, toBudget(change.record)) };
  }
  if (change.table === 'goals') {
    return { ...state, goals: upsertById(state.goals, toGoal(change.record)) };
  }

  return { ...state, debts: upsertById(state.debts, toDebt(change.record)) };
};

const parseCachedFinanceState = (raw: string | null): FinanceDataState => {
  if (!raw) return defaultFinanceState;

  try {
    const parsed = JSON.parse(raw) as Partial<FinanceDataState>;
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      debts: Array.isArray(parsed.debts) ? parsed.debts : [],
      pendingChanges: Array.isArray(parsed.pendingChanges) ? parsed.pendingChanges : [],
      lastSyncedAt: parsed.lastSyncedAt ?? null,
    };
  } catch {
    return defaultFinanceState;
  }
};

export function FinanceDataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<FinanceDataState>(defaultFinanceState);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);

  const runSync = useCallback(
    async (changes: SyncChange[], lastSyncedAt: string | null) => {
      if (!session || !API_BASE_URL) return;

      setSyncing(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            last_sync_at: lastSyncedAt,
            changes,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(`sync failed (${response.status}): ${JSON.stringify(body)}`);
        }

        const payload = (await response.json()) as SyncResponse;
        setState((prev) => {
          const withServerChanges = payload.server_changes.reduce(applyServerChange, prev);
          const acknowledged = new Set(payload.acknowledged);
          return {
            ...withServerChanges,
            pendingChanges: withServerChanges.pendingChanges.filter(
              (change) => !change.record_id || !acknowledged.has(change.record_id)
            ),
            lastSyncedAt: payload.synced_at,
          };
        });
      } catch (syncError) {
        setError(syncError instanceof Error ? syncError.message : 'Unable to sync now.');
      } finally {
        setSyncing(false);
      }
    },
    [session]
  );

  useEffect(() => {
    let cancelled = false;

    if (!session) {
      setState(defaultFinanceState);
      setLoading(false);
      setError(null);
      setHydratedUserId(null);
      return;
    }

    const hydrateAndSync = async () => {
      setLoading(true);

      const key = storageKeyForUser(session.user.id);
      const cachedRaw = await AsyncStorage.getItem(key).catch(() => null);
      const cachedState = parseCachedFinanceState(cachedRaw);

      if (cancelled) return;

      setState(cachedState);
      setHydratedUserId(session.user.id);
      setLoading(false);

      if (API_BASE_URL) {
        await runSync(cachedState.pendingChanges, cachedState.lastSyncedAt);
      }
    };

    hydrateAndSync();

    return () => {
      cancelled = true;
    };
  }, [session, runSync]);

  useEffect(() => {
    if (!session || hydratedUserId !== session.user.id) return;

    AsyncStorage.setItem(storageKeyForUser(session.user.id), JSON.stringify(state)).catch(() => undefined);
  }, [state, session, hydratedUserId]);

  const syncNow = useCallback(async () => {
    await runSync(state.pendingChanges, state.lastSyncedAt);
  }, [runSync, state.pendingChanges]);

  const addTransaction = useCallback(
    async (input: AddTransactionInput) => {
      if (!session) return;

      const id = createId();
      const version = 1;
      const date = input.date ?? nowIso();

      const record: TransactionRecord = {
        id,
        user_id: session.user.id,
        type: input.type,
        amount: input.amount,
        title: input.title,
        category_id: input.categoryId ?? null,
        date,
        note: input.note ?? null,
        version,
        created_at: date,
        updated_at: date,
        deleted_at: null,
      };

      const change: SyncChange = {
        table: 'transactions',
        action: 'create',
        record_id: id,
        record: record as unknown as Record<string, unknown>,
        version,
      };

      setState((prev) => ({
        ...prev,
        transactions: upsertById(prev.transactions, record),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, session, state.lastSyncedAt]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const existing = state.transactions.find((tx) => tx.id === id);
      if (!existing) return;

      const change: SyncChange = {
        table: 'transactions',
        action: 'delete',
        record_id: id,
        version: Math.max(1, existing.version + 1),
      };

      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((tx) => tx.id !== id),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.transactions, state.lastSyncedAt]
  );

  const value = useMemo<FinanceDataContextValue>(
    () => ({
      state,
      loading,
      syncing,
      error,
      syncNow,
      addTransaction,
      deleteTransaction,
    }),
    [state, loading, syncing, error, syncNow, addTransaction, deleteTransaction]
  );

  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>;
}

export function useFinanceData() {
  const context = useContext(FinanceDataContext);
  if (!context) throw new Error('useFinanceData must be used within FinanceDataProvider');
  return context;
}
