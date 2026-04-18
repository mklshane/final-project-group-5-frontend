import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SYSTEM_CATEGORIES } from '@/constants/defaultCategories';
import { DEFAULT_WALLET } from '@/constants/defaultWallets';
import { useAuth } from '@/context/AuthContext';
import type {
  BudgetPeriod,
  BudgetRecord,
  CategoryRecord,
  DebtCounterpartyKind,
  DebtRecord,
  GoalRecord,
  SyncChange,
  SyncResponse,
  TransactionRecord,
  WalletRecord,
  WalletType,
} from '@/types/finance';

interface FinanceDataState {
  transactions: TransactionRecord[];
  wallets: WalletRecord[];
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
  walletId?: string | null;
  categoryId?: string | null;
  date?: string;
  note?: string;
}

interface AddWalletInput {
  name: string;
  type?: WalletType;
  institutionName?: string | null;
  openingBalance?: number;
  currentBalance?: number;
  isDefault?: boolean;
}

interface UpdateWalletInput {
  id: string;
  name?: string;
  type?: WalletType;
  institutionName?: string | null;
  openingBalance?: number;
  currentBalance?: number;
  isDefault?: boolean;
}

interface AddCategoryInput {
  name: string;
  icon?: string | null;
  color?: string | null;
  type?: 'expense' | 'income' | 'both';
  sortOrder?: number;
}

interface UpdateCategoryInput {
  id: string;
  name?: string;
  icon?: string | null;
  color?: string | null;
  type?: 'expense' | 'income' | 'both';
  sortOrder?: number;
}

interface AddBudgetInput {
  categoryId: string;
  amountLimit: number;
  period: BudgetPeriod;
  alertThreshold?: number;
}

interface UpdateBudgetInput {
  id: string;
  categoryId?: string;
  amountLimit?: number;
  period?: BudgetPeriod;
  alertThreshold?: number;
}

interface AddGoalInput {
  title: string;
  targetAmount: number;
  savedAmount?: number;
  deadline?: string | null;
}

interface UpdateGoalInput {
  id: string;
  title?: string;
  targetAmount?: number;
  savedAmount?: number;
  deadline?: string | null;
}

interface AddDebtInput {
  type: 'owe' | 'owed';
  counterpartyKind?: DebtCounterpartyKind;
  counterpartyName: string;
  totalAmount: number;
  amountPaid?: number;
  dueDate: string;
  notes?: string;
}

interface UpdateDebtInput {
  id: string;
  counterpartyKind?: DebtCounterpartyKind;
  counterpartyName?: string;
  totalAmount?: number;
  amountPaid?: number;
  dueDate?: string;
  notes?: string;
}

interface FinanceDataContextValue {
  state: FinanceDataState;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  syncNow: () => Promise<void>;
  addTransaction: (input: AddTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addWallet: (input: AddWalletInput) => Promise<void>;
  updateWallet: (input: UpdateWalletInput) => Promise<void>;
  archiveWallet: (id: string) => Promise<void>;
  addCategory: (input: AddCategoryInput) => Promise<void>;
  updateCategory: (input: UpdateCategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addBudget: (input: AddBudgetInput) => Promise<void>;
  updateBudget: (input: UpdateBudgetInput) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addGoal: (input: AddGoalInput) => Promise<void>;
  updateGoal: (input: UpdateGoalInput) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addDebt: (input: AddDebtInput) => Promise<void>;
  updateDebt: (input: UpdateDebtInput) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
}

const FinanceDataContext = createContext<FinanceDataContextValue | null>(null);
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const STORAGE_KEY_PREFIX = 'budgy_finance_data_v1';

const defaultFinanceState: FinanceDataState = {
  transactions: [],
  wallets: [],
  categories: [],
  budgets: [],
  goals: [],
  debts: [],
  pendingChanges: [],
  lastSyncedAt: null,
};

const storageKeyForUser = (userId: string) => `${STORAGE_KEY_PREFIX}:${userId}`;

const createId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

const nowIso = () => new Date().toISOString();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_REGEX.test(value);

const getChangeRecordId = (change: SyncChange) => {
  if (isUuid(change.record_id)) return change.record_id;
  const recordId = change.record && typeof change.record.id === 'string' ? change.record.id : null;
  return isUuid(recordId) ? recordId : null;
};

const changeQueueKey = (change: SyncChange) => {
  const recordId = getChangeRecordId(change) ?? 'invalid';
  return `${change.table}:${change.action}:${recordId}:${change.version}`;
};

const normalizeOutgoingChange = (change: SyncChange): SyncChange | null => {
  const recordId = getChangeRecordId(change);

  if (change.action === 'delete') {
    if (!recordId) return null;
    return { ...change, record_id: recordId };
  }

  if (!change.record || !recordId) return null;

  return {
    ...change,
    record_id: recordId,
    record: {
      ...change.record,
      id: recordId,
    },
  };
};

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeBudgetPeriod = (value: unknown): BudgetPeriod => {
  if (value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'yearly') {
    return value;
  }

  if (value === 'annual') return 'yearly';
  return 'monthly';
};

const normalizeAlertThreshold = (value: unknown, fallback = 0.8) => {
  const raw = toNumber(value, fallback);
  const ratio = raw > 1 ? raw / 100 : raw;
  return Math.min(1, Math.max(0, ratio));
};

const toTransaction = (record: Record<string, unknown>): TransactionRecord => ({
  id: String(record.id),
  user_id: record.user_id ? String(record.user_id) : undefined,
  type: record.type === 'income' ? 'income' : 'expense',
  amount: toNumber(record.amount),
  title: String(record.title ?? 'Untitled'),
  wallet_id: record.wallet_id ? String(record.wallet_id) : null,
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

const toWallet = (record: Record<string, unknown>): WalletRecord => {
  const rawType = String(record.type ?? 'general');
  const type: WalletType = rawType === 'bank' || rawType === 'ewallet' || rawType === 'cash' ? rawType : 'general';

  return {
    id: String(record.id),
    user_id: record.user_id ? String(record.user_id) : undefined,
    name: String(record.name ?? 'General'),
    type,
    institution_name: record.institution_name ? String(record.institution_name) : null,
    opening_balance: toNumber(record.opening_balance, 0),
    current_balance: toNumber(record.current_balance, 0),
    is_default: Boolean(record.is_default),
    sort_order: toNumber(record.sort_order, 0),
    version: toNumber(record.version, 1),
    created_at: record.created_at ? String(record.created_at) : undefined,
    updated_at: record.updated_at ? String(record.updated_at) : undefined,
    deleted_at: record.deleted_at ? String(record.deleted_at) : null,
  };
};

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
  period: normalizeBudgetPeriod(record.period),
  alert_threshold: normalizeAlertThreshold(record.alert_threshold, 0.8),
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
  counterparty_kind:
    record.counterparty_kind === 'entity' || record.counterparty_kind === 'organization'
      ? record.counterparty_kind
      : 'person',
  counterparty_name: String(record.counterparty_name ?? record.person_name ?? 'Unknown'),
  total_amount: toNumber(record.total_amount ?? record.amount),
  amount_paid: toNumber(record.amount_paid, 0),
  due_date: String(record.due_date ?? nowIso()),
  type: record.type === 'owed' ? 'owed' : 'owe',
  notes: record.notes ? String(record.notes) : record.description ? String(record.description) : null,
  person_name: record.person_name ? String(record.person_name) : undefined,
  amount: toNumber(record.amount, 0),
  description: record.description ? String(record.description) : null,
  is_settled:
    typeof record.is_settled === 'boolean'
      ? Boolean(record.is_settled)
      : toNumber(record.amount_paid, 0) >= toNumber(record.total_amount ?? record.amount, 0),
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

const normalizeDebtForWrite = (record: DebtRecord): DebtRecord => {
  const total = Math.max(0, toNumber(record.total_amount));
  const paid = Math.max(0, Math.min(total, toNumber(record.amount_paid)));
  const settled = paid >= total && total > 0;

  return {
    ...record,
    counterparty_kind: record.type === 'owe' ? record.counterparty_kind ?? 'person' : undefined,
    total_amount: total,
    amount_paid: paid,
    amount: total,
    person_name: record.counterparty_name,
    description: record.notes ?? null,
    is_settled: settled,
    settled_at: settled ? record.settled_at ?? nowIso() : null,
  };
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
    if (change.table === 'wallets') {
      return { ...state, wallets: state.wallets.filter((w) => w.id !== change.record_id) };
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
    const newCat = toCategory(change.record);
    const deduped = state.categories.filter(
      (c) => c.id === newCat.id || c.name.trim().toLowerCase() !== newCat.name.trim().toLowerCase()
    );
    return { ...state, categories: upsertById(deduped, newCat) };
  }
  if (change.table === 'wallets') {
    return { ...state, wallets: upsertById(state.wallets, toWallet(change.record)) };
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
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
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

const createDefaultCategoryRecords = (userId: string): CategoryRecord[] => {
  const timestamp = nowIso();
  return DEFAULT_SYSTEM_CATEGORIES.map((category) => ({
    id: createId(),
    user_id: userId,
    name: category.name,
    icon: category.icon,
    color: category.color,
    type: category.type,
    is_default: true,
    sort_order: category.sortOrder,
    version: 1,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
  }));
};

const createDefaultWalletRecord = (userId: string, openingBalance = 0): WalletRecord => {
  const timestamp = nowIso();
  return {
    id: createId(),
    user_id: userId,
    name: DEFAULT_WALLET.name,
    type: DEFAULT_WALLET.type,
    institution_name: null,
    opening_balance: openingBalance,
    current_balance: openingBalance,
    is_default: DEFAULT_WALLET.isDefault,
    sort_order: DEFAULT_WALLET.sortOrder,
    version: 1,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
  };
};

export function FinanceDataProvider({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();
  const [state, setState] = useState<FinanceDataState>(defaultFinanceState);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [walletsSeededForUserId, setWalletsSeededForUserId] = useState<string | null>(null);

  const runSync = useCallback(
    async (changes: SyncChange[], lastSyncedAt: string | null) => {
      if (!session || !API_BASE_URL) return;

      const normalizedEntries = changes.map((change) => ({
        original: change,
        normalized: normalizeOutgoingChange(change),
      }));
      const validChanges = normalizedEntries
        .filter((entry): entry is { original: SyncChange; normalized: SyncChange } => Boolean(entry.normalized))
        .map((entry) => entry.normalized);
      const droppedKeys = new Set(
        normalizedEntries
          .filter((entry) => !entry.normalized)
          .map((entry) => changeQueueKey(entry.original))
      );

      if (droppedKeys.size > 0) {
        setState((prev) => ({
          ...prev,
          pendingChanges: prev.pendingChanges.filter((change) => !droppedKeys.has(changeQueueKey(change))),
        }));
        setError(`Skipped ${droppedKeys.size} invalid queued change(s). Please retry your last action.`);
      }

      if (validChanges.length === 0) {
        return;
      }

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
            changes: validChanges,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(`sync failed (${response.status}): ${JSON.stringify(body)}`);
        }

        const payload = (await response.json()) as SyncResponse;
        if (payload.failed_changes?.length) {
          const first = payload.failed_changes[0];
          setError(`Sync issue on ${first.table}: ${first.error}`);
        }
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
      setWalletsSeededForUserId(null);
      return;
    }

    const hydrateAndSync = async () => {
      setLoading(true);

      const key = storageKeyForUser(session.user.id);
      const cachedRaw = await AsyncStorage.getItem(key).catch(() => null);
      let cachedState = parseCachedFinanceState(cachedRaw);

      // Seed any missing default categories synchronously before first render.
      // Doing this here (not in a separate effect) avoids TOKEN_REFRESHED race
      // conditions where the guard fires but state was reset to empty.
      const existingNames = new Set(
        cachedState.categories
          .filter((c) => !c.deleted_at)
          .map((c) => c.name.trim().toLowerCase())
      );
      const missingTemplates = DEFAULT_SYSTEM_CATEGORIES.filter(
        (t) => !existingNames.has(t.name.trim().toLowerCase())
      );
      if (missingTemplates.length > 0) {
        const timestamp = nowIso();
        const newRecords: CategoryRecord[] = missingTemplates.map((t) => ({
          id: createId(),
          user_id: session.user.id,
          name: t.name,
          icon: t.icon,
          color: t.color,
          type: t.type,
          is_default: true,
          sort_order: t.sortOrder,
          version: 1,
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null,
        }));
        const newChanges: SyncChange[] = newRecords.map((r) => ({
          table: 'categories',
          action: 'create',
          record_id: r.id,
          record: r as unknown as Record<string, unknown>,
          version: r.version,
        }));
        cachedState = {
          ...cachedState,
          categories: [...cachedState.categories, ...newRecords],
          pendingChanges: [...cachedState.pendingChanges, ...newChanges],
        };
      }

      if (cancelled) return;

      setState(cachedState);
      setHydratedUserId(session.user.id);

      // If we already have wallets in the local cache we can reveal the UI
      // immediately (cache-first) while the background sync runs.
      // If the cache has no wallets we must keep loading=true until the
      // initial sync finishes so that existing server wallets arrive before
      // the wallet-seeding effect has a chance to fire — otherwise it would
      // create a duplicate "General" wallet and hit the unique constraint.
      const hasLocalWallets = cachedState.wallets.some((w) => !w.deleted_at);
      if (hasLocalWallets) {
        setLoading(false);
      }

      if (API_BASE_URL) {
        await runSync(cachedState.pendingChanges, cachedState.lastSyncedAt);
      }

      if (!cancelled) {
        setLoading(false); // no-op when already false (warm-cache path)
      }
    };

    hydrateAndSync();

    return () => {
      cancelled = true;
    };
  }, [session, runSync]);

  useEffect(() => {
    if (!session || loading) return;
    if (!profile?.onboarding_done) return; // wait until onboarding is complete so balance is available
    if (walletsSeededForUserId === session.user.id) return;
    if (state.wallets.length > 0) {
      setWalletsSeededForUserId(session.user.id);
      return;
    }

    const defaultWallet = createDefaultWalletRecord(session.user.id, profile?.balance ?? 0);
    const change: SyncChange = {
      table: 'wallets',
      action: 'create',
      record_id: defaultWallet.id,
      record: defaultWallet as unknown as Record<string, unknown>,
      version: defaultWallet.version,
    };

    setState((prev) => ({
      ...prev,
      wallets: [defaultWallet],
      pendingChanges: [...prev.pendingChanges, change],
    }));
    setWalletsSeededForUserId(session.user.id);

    void runSync([change], state.lastSyncedAt);
  }, [walletsSeededForUserId, loading, runSync, session, profile, state.lastSyncedAt, state.wallets.length]);

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
      const timestamp = nowIso();
      const date = input.date ?? timestamp;
      const resolvedWalletId =
        input.walletId ??
        state.wallets.find((wallet) => wallet.is_default && !wallet.deleted_at)?.id ??
        state.wallets.find((wallet) => !wallet.deleted_at)?.id ??
        null;

      const record: TransactionRecord = {
        id,
        user_id: session.user.id,
        type: input.type,
        amount: input.amount,
        title: input.title,
        wallet_id: resolvedWalletId,
        category_id: input.categoryId ?? null,
        date,
        note: input.note ?? null,
        version,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
      };

      const walletToAdjust =
        record.wallet_id
          ? state.wallets.find((wallet) => wallet.id === record.wallet_id && !wallet.deleted_at)
          : undefined;
      const walletDelta = record.type === 'income' ? record.amount : -record.amount;

      const updatedWallet = walletToAdjust
        ? {
            ...walletToAdjust,
            current_balance: toNumber(walletToAdjust.current_balance) + walletDelta,
            version: Math.max(1, walletToAdjust.version + 1),
            updated_at: timestamp,
          }
        : null;

      const change: SyncChange = {
        table: 'transactions',
        action: 'create',
        record_id: id,
        record: record as unknown as Record<string, unknown>,
        version,
      };

      const walletChange: SyncChange | null = updatedWallet
        ? {
            table: 'wallets',
            action: 'update',
            record_id: updatedWallet.id,
            record: updatedWallet as unknown as Record<string, unknown>,
            version: updatedWallet.version,
          }
        : null;

      const syncChanges = walletChange ? [walletChange, change] : [change];

      setState((prev) => ({
        ...prev,
        transactions: upsertById(prev.transactions, record),
        wallets: updatedWallet ? upsertById(prev.wallets, updatedWallet) : prev.wallets,
        pendingChanges: [...prev.pendingChanges, ...syncChanges],
      }));

      await runSync(syncChanges, state.lastSyncedAt);
    },
    [runSync, session, state.lastSyncedAt, state.wallets]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const existing = state.transactions.find((tx) => tx.id === id);
      if (!existing) return;

      const walletToAdjust =
        existing.wallet_id
          ? state.wallets.find((wallet) => wallet.id === existing.wallet_id && !wallet.deleted_at)
          : undefined;
      const walletDelta = existing.type === 'income' ? -existing.amount : existing.amount;
      const updatedWallet = walletToAdjust
        ? {
            ...walletToAdjust,
            current_balance: toNumber(walletToAdjust.current_balance) + walletDelta,
            version: Math.max(1, walletToAdjust.version + 1),
            updated_at: nowIso(),
          }
        : null;

      const change: SyncChange = {
        table: 'transactions',
        action: 'delete',
        record_id: id,
        version: Math.max(1, existing.version + 1),
      };

      const walletChange: SyncChange | null = updatedWallet
        ? {
            table: 'wallets',
            action: 'update',
            record_id: updatedWallet.id,
            record: updatedWallet as unknown as Record<string, unknown>,
            version: updatedWallet.version,
          }
        : null;

      const syncChanges = walletChange ? [change, walletChange] : [change];

      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((tx) => tx.id !== id),
        wallets: updatedWallet ? upsertById(prev.wallets, updatedWallet) : prev.wallets,
        pendingChanges: [...prev.pendingChanges, ...syncChanges],
      }));

      await runSync(syncChanges, state.lastSyncedAt);
    },
    [runSync, state.lastSyncedAt, state.transactions, state.wallets]
  );

  const addCategory = useCallback(
    async (input: AddCategoryInput) => {
      if (!session) return;

      const trimmedName = input.name.trim();
      if (!trimmedName) return;

      const id = createId();
      const version = 1;
      const date = nowIso();
      const safeType = input.type ?? 'expense';

      const maxOrder = state.categories.reduce((max, category) => {
        const current = Number(category.sort_order ?? 0);
        return current > max ? current : max;
      }, 0);

      const record: CategoryRecord = {
        id,
        user_id: session.user.id,
        name: trimmedName,
        icon: input.icon ?? null,
        color: input.color ?? null,
        type: safeType,
        is_default: false,
        sort_order: input.sortOrder ?? maxOrder + 1,
        version,
        created_at: date,
        updated_at: date,
        deleted_at: null,
      };

      const change: SyncChange = {
        table: 'categories',
        action: 'create',
        record_id: id,
        record: record as unknown as Record<string, unknown>,
        version,
      };

      setState((prev) => ({
        ...prev,
        categories: upsertById(prev.categories, record),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, session, state.categories, state.lastSyncedAt]
  );

  const addWallet = useCallback(
    async (input: AddWalletInput) => {
      if (!session) return;

      const name = input.name.trim();
      if (!name) return;

      const id = createId();
      const version = 1;
      const date = nowIso();
      const activeWallets = state.wallets.filter((wallet) => !wallet.deleted_at);
      const maxOrder = activeWallets.reduce((max, wallet) => Math.max(max, wallet.sort_order ?? 0), 0);

      const record: WalletRecord = {
        id,
        user_id: session.user.id,
        name,
        type: input.type ?? 'general',
        institution_name: input.institutionName ?? null,
        opening_balance: input.openingBalance ?? 0,
        current_balance: input.currentBalance ?? input.openingBalance ?? 0,
        is_default: activeWallets.length === 0 ? true : Boolean(input.isDefault),
        sort_order: maxOrder + 1,
        version,
        created_at: date,
        updated_at: date,
        deleted_at: null,
      };

      const change: SyncChange = {
        table: 'wallets',
        action: 'create',
        record_id: id,
        record: record as unknown as Record<string, unknown>,
        version,
      };

      setState((prev) => {
        const nextWallets = record.is_default
          ? prev.wallets.map((wallet) => ({ ...wallet, is_default: wallet.id === record.id }))
          : prev.wallets;

        return {
          ...prev,
          wallets: upsertById(nextWallets, record),
          pendingChanges: [...prev.pendingChanges, change],
        };
      });

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, session, state.lastSyncedAt, state.wallets]
  );

  const updateWallet = useCallback(
    async (input: UpdateWalletInput) => {
      const existing = state.wallets.find((wallet) => wallet.id === input.id && !wallet.deleted_at);
      if (!existing) return;

      const name = input.name !== undefined ? input.name.trim() : existing.name;
      if (!name) return;

      const nextVersion = Math.max(1, existing.version + 1);
      const updated: WalletRecord = {
        ...existing,
        name,
        type: input.type ?? existing.type,
        institution_name: input.institutionName !== undefined ? input.institutionName : existing.institution_name,
        opening_balance: input.openingBalance ?? existing.opening_balance ?? 0,
        current_balance: input.currentBalance ?? existing.current_balance,
        is_default: input.isDefault ?? existing.is_default,
        version: nextVersion,
        updated_at: nowIso(),
      };

      const change: SyncChange = {
        table: 'wallets',
        action: 'update',
        record_id: updated.id,
        record: updated as unknown as Record<string, unknown>,
        version: nextVersion,
      };

      setState((prev) => {
        const nextWallets = updated.is_default
          ? prev.wallets.map((wallet) => ({ ...wallet, is_default: wallet.id === updated.id }))
          : prev.wallets;

        return {
          ...prev,
          wallets: upsertById(nextWallets, updated),
          pendingChanges: [...prev.pendingChanges, change],
        };
      });

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.lastSyncedAt, state.wallets]
  );

  const archiveWallet = useCallback(
    async (id: string) => {
      const activeWallets = state.wallets.filter((wallet) => !wallet.deleted_at);
      if (activeWallets.length <= 1) return;

      const existing = activeWallets.find((wallet) => wallet.id === id);
      if (!existing) return;

      const nextVersion = Math.max(1, existing.version + 1);
      const change: SyncChange = {
        table: 'wallets',
        action: 'delete',
        record_id: id,
        version: nextVersion,
      };

      setState((prev) => {
        let remaining = prev.wallets.filter((wallet) => wallet.id !== id);

        if (existing.is_default) {
          const nextDefaultId = remaining.find((wallet) => !wallet.deleted_at)?.id;
          remaining = remaining.map((wallet) => ({
            ...wallet,
            is_default: nextDefaultId ? wallet.id === nextDefaultId : wallet.is_default,
          }));
        }

        return {
          ...prev,
          wallets: remaining,
          pendingChanges: [...prev.pendingChanges, change],
        };
      });

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.lastSyncedAt, state.wallets]
  );

  const updateCategory = useCallback(
    async (input: UpdateCategoryInput) => {
      const existing = state.categories.find((category) => category.id === input.id && !category.deleted_at);
      if (!existing) return;

      const nextName = input.name !== undefined ? input.name.trim() : existing.name;
      if (!nextName) return;

      const nextVersion = Math.max(1, existing.version + 1);
      const updatedAt = nowIso();

      const updated: CategoryRecord = {
        ...existing,
        name: nextName,
        icon: input.icon !== undefined ? input.icon : existing.icon,
        color: input.color !== undefined ? input.color : existing.color,
        type: input.type ?? existing.type ?? 'expense',
        sort_order: input.sortOrder ?? existing.sort_order ?? 0,
        version: nextVersion,
        updated_at: updatedAt,
      };

      const change: SyncChange = {
        table: 'categories',
        action: 'update',
        record_id: updated.id,
        record: updated as unknown as Record<string, unknown>,
        version: nextVersion,
      };

      setState((prev) => ({
        ...prev,
        categories: upsertById(prev.categories, updated),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.categories, state.lastSyncedAt]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const existing = state.categories.find((category) => category.id === id && !category.deleted_at);
      if (!existing) return;

      const nextVersion = Math.max(1, existing.version + 1);
      const deletedRecord: CategoryRecord = {
        ...existing,
        version: nextVersion,
        deleted_at: nowIso(),
        updated_at: nowIso(),
      };

      const change: SyncChange = {
        table: 'categories',
        action: 'delete',
        record_id: id,
        version: nextVersion,
      };

      setState((prev) => ({
        ...prev,
        categories: prev.categories.filter((category) => category.id !== id),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync(
        [
          {
            table: 'categories',
            action: 'update',
            record_id: id,
            record: deletedRecord as unknown as Record<string, unknown>,
            version: nextVersion,
          },
          change,
        ],
        state.lastSyncedAt
      );
    },
    [runSync, state.categories, state.lastSyncedAt]
  );

  const addBudget = useCallback(
    async (input: AddBudgetInput) => {
      if (!session) return;

      const categoryId = input.categoryId.trim();
      const amountLimit = Math.max(0, toNumber(input.amountLimit));
      const period = normalizeBudgetPeriod(input.period);
      const alertThreshold = normalizeAlertThreshold(input.alertThreshold, 0.8);

      if (!categoryId || amountLimit <= 0) return;

      const existing = state.budgets.find((budget) => !budget.deleted_at && budget.category_id === categoryId);

      if (existing) {
        const nextVersion = Math.max(1, existing.version + 1);
        const updated: BudgetRecord = {
          ...existing,
          amount_limit: amountLimit,
          period,
          alert_threshold: alertThreshold,
          version: nextVersion,
          updated_at: nowIso(),
        };

        const change: SyncChange = {
          table: 'budgets',
          action: 'update',
          record_id: updated.id,
          record: updated as unknown as Record<string, unknown>,
          version: nextVersion,
        };

        setState((prev) => ({
          ...prev,
          budgets: upsertById(prev.budgets, updated),
          pendingChanges: [...prev.pendingChanges, change],
        }));

        await runSync([change], state.lastSyncedAt);
        return;
      }

      const id = createId();
      const version = 1;
      const date = nowIso();

      const record: BudgetRecord = {
        id,
        user_id: session.user.id,
        category_id: categoryId,
        amount_limit: amountLimit,
        period,
        alert_threshold: alertThreshold,
        version,
        created_at: date,
        updated_at: date,
        deleted_at: null,
      };

      const change: SyncChange = {
        table: 'budgets',
        action: 'create',
        record_id: id,
        record: record as unknown as Record<string, unknown>,
        version,
      };

      setState((prev) => ({
        ...prev,
        budgets: upsertById(prev.budgets, record),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, session, state.budgets, state.lastSyncedAt]
  );

  const updateBudget = useCallback(
    async (input: UpdateBudgetInput) => {
      const existing = state.budgets.find((budget) => budget.id === input.id && !budget.deleted_at);
      if (!existing) return;

      const categoryId = input.categoryId !== undefined ? input.categoryId.trim() : existing.category_id;
      const amountLimit =
        input.amountLimit !== undefined ? Math.max(0, toNumber(input.amountLimit)) : toNumber(existing.amount_limit);
      const period = input.period !== undefined ? normalizeBudgetPeriod(input.period) : existing.period;
      const alertThreshold =
        input.alertThreshold !== undefined
          ? normalizeAlertThreshold(input.alertThreshold)
          : normalizeAlertThreshold(existing.alert_threshold, 0.8);

      if (!categoryId || amountLimit <= 0) return;

      const duplicate = state.budgets.find(
        (budget) =>
          !budget.deleted_at &&
          budget.id !== existing.id &&
          budget.category_id === categoryId
      );

      if (duplicate) {
        const mergedVersion = Math.max(1, duplicate.version + 1);
        const deleteVersion = Math.max(1, existing.version + 1);
        const updatedAt = nowIso();

        const mergedBudget: BudgetRecord = {
          ...duplicate,
          amount_limit: amountLimit,
          alert_threshold: alertThreshold,
          version: mergedVersion,
          updated_at: updatedAt,
        };

        const mergeChange: SyncChange = {
          table: 'budgets',
          action: 'update',
          record_id: mergedBudget.id,
          record: mergedBudget as unknown as Record<string, unknown>,
          version: mergedVersion,
        };

        const deleteChange: SyncChange = {
          table: 'budgets',
          action: 'delete',
          record_id: existing.id,
          version: deleteVersion,
        };

        setState((prev) => ({
          ...prev,
          budgets: upsertById(prev.budgets.filter((budget) => budget.id !== existing.id), mergedBudget),
          pendingChanges: [...prev.pendingChanges, mergeChange, deleteChange],
        }));

        await runSync([mergeChange, deleteChange], state.lastSyncedAt);
        return;
      }

      const nextVersion = Math.max(1, existing.version + 1);
      const updated: BudgetRecord = {
        ...existing,
        category_id: categoryId,
        amount_limit: amountLimit,
        period,
        alert_threshold: alertThreshold,
        version: nextVersion,
        updated_at: nowIso(),
      };

      const change: SyncChange = {
        table: 'budgets',
        action: 'update',
        record_id: updated.id,
        record: updated as unknown as Record<string, unknown>,
        version: nextVersion,
      };

      setState((prev) => ({
        ...prev,
        budgets: upsertById(prev.budgets, updated),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.budgets, state.lastSyncedAt]
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      const existing = state.budgets.find((budget) => budget.id === id && !budget.deleted_at);
      if (!existing) return;

      const nextVersion = Math.max(1, existing.version + 1);
      const change: SyncChange = {
        table: 'budgets',
        action: 'delete',
        record_id: id,
        version: nextVersion,
      };

      setState((prev) => ({
        ...prev,
        budgets: prev.budgets.filter((budget) => budget.id !== id),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.budgets, state.lastSyncedAt]
  );

  const addGoal = useCallback(
    async (input: AddGoalInput) => {
      if (!session) return;

      const title = input.title.trim();
      const targetAmount = Math.max(0, toNumber(input.targetAmount));
      const savedAmount = Math.max(0, toNumber(input.savedAmount, 0));
      const deadline = input.deadline?.trim() ? input.deadline.trim() : null;

      if (!title || targetAmount <= 0 || savedAmount > targetAmount) return;

      const id = createId();
      const version = 1;
      const date = nowIso();

      const record: GoalRecord = {
        id,
        user_id: session.user.id,
        title,
        target_amount: targetAmount,
        saved_amount: savedAmount,
        deadline,
        version,
        created_at: date,
        updated_at: date,
        deleted_at: null,
      };

      const change: SyncChange = {
        table: 'goals',
        action: 'create',
        record_id: id,
        record: record as unknown as Record<string, unknown>,
        version,
      };

      setState((prev) => ({
        ...prev,
        goals: upsertById(prev.goals, record),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, session, state.lastSyncedAt]
  );

  const updateGoal = useCallback(
    async (input: UpdateGoalInput) => {
      const existing = state.goals.find((goal) => goal.id === input.id && !goal.deleted_at);
      if (!existing) return;

      const title = input.title !== undefined ? input.title.trim() : existing.title;
      const targetAmount =
        input.targetAmount !== undefined ? Math.max(0, toNumber(input.targetAmount)) : toNumber(existing.target_amount);
      const savedAmount =
        input.savedAmount !== undefined ? Math.max(0, toNumber(input.savedAmount)) : toNumber(existing.saved_amount, 0);
      const deadline =
        input.deadline !== undefined ? (input.deadline?.trim() ? input.deadline.trim() : null) : (existing.deadline ?? null);

      if (!title || targetAmount <= 0 || savedAmount > targetAmount) return;

      const nextVersion = Math.max(1, existing.version + 1);
      const updated: GoalRecord = {
        ...existing,
        title,
        target_amount: targetAmount,
        saved_amount: savedAmount,
        deadline,
        version: nextVersion,
        updated_at: nowIso(),
      };

      const change: SyncChange = {
        table: 'goals',
        action: 'update',
        record_id: updated.id,
        record: updated as unknown as Record<string, unknown>,
        version: nextVersion,
      };

      setState((prev) => ({
        ...prev,
        goals: upsertById(prev.goals, updated),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.goals, state.lastSyncedAt]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const existing = state.goals.find((goal) => goal.id === id && !goal.deleted_at);
      if (!existing) return;

      const nextVersion = Math.max(1, existing.version + 1);
      const change: SyncChange = {
        table: 'goals',
        action: 'delete',
        record_id: id,
        version: nextVersion,
      };

      setState((prev) => ({
        ...prev,
        goals: prev.goals.filter((goal) => goal.id !== id),
        pendingChanges: [...prev.pendingChanges, change],
      }));

      await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.goals, state.lastSyncedAt]
  );

  const addDebt = useCallback(
    async (input: AddDebtInput) => {
      if (!session) return;

        const counterpartyName = input.counterpartyName.trim();
        const dueDate = input.dueDate.trim();
        const totalAmount = Math.max(0, toNumber(input.totalAmount));
        const amountPaid = Math.max(0, toNumber(input.amountPaid, 0));
        const safeNotes = input.notes?.trim() ? input.notes.trim() : null;

        if (!counterpartyName || !dueDate || totalAmount <= 0 || amountPaid > totalAmount) return;
        if (input.type === 'owe' && !input.counterpartyKind) return;

        const id = createId();
        const version = 1;
        const date = nowIso();

        const baseRecord: DebtRecord = {
          id,
          user_id: session.user.id,
          type: input.type,
          counterparty_kind: input.type === 'owe' ? input.counterpartyKind ?? 'person' : undefined,
          counterparty_name: counterpartyName,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          due_date: dueDate,
          notes: safeNotes,
          version,
          created_at: date,
          updated_at: date,
          deleted_at: null,
        };

        const record = normalizeDebtForWrite(baseRecord);

        const change: SyncChange = {
          table: 'debts',
          action: 'create',
          record_id: id,
          record: record as unknown as Record<string, unknown>,
          version,
        };

        setState((prev) => ({
          ...prev,
          debts: upsertById(prev.debts, record),
          pendingChanges: [...prev.pendingChanges, change],
        }));

        await runSync([change], state.lastSyncedAt);
    },
    [runSync, session, state.lastSyncedAt]
  );

  const updateDebt = useCallback(
    async (input: UpdateDebtInput) => {
      const existing = state.debts.find((debt) => debt.id === input.id && !debt.deleted_at);
      if (!existing) return;

        const counterpartyName =
          input.counterpartyName !== undefined ? input.counterpartyName.trim() : existing.counterparty_name;
        const dueDate = input.dueDate !== undefined ? input.dueDate.trim() : existing.due_date;
        const totalAmount =
          input.totalAmount !== undefined ? Math.max(0, toNumber(input.totalAmount)) : toNumber(existing.total_amount);
        const amountPaid =
          input.amountPaid !== undefined ? Math.max(0, toNumber(input.amountPaid)) : toNumber(existing.amount_paid, 0);
        const safeNotes =
          input.notes !== undefined ? (input.notes.trim() ? input.notes.trim() : null) : (existing.notes ?? null);

        if (!counterpartyName || !dueDate || totalAmount <= 0 || amountPaid > totalAmount) return;

        const nextVersion = Math.max(1, existing.version + 1);
        const baseUpdated: DebtRecord = {
          ...existing,
          counterparty_kind:
            existing.type === 'owe' ? input.counterpartyKind ?? existing.counterparty_kind ?? 'person' : undefined,
          counterparty_name: counterpartyName,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          due_date: dueDate,
          notes: safeNotes,
          version: nextVersion,
          updated_at: nowIso(),
        };

        if (baseUpdated.type === 'owe' && !baseUpdated.counterparty_kind) return;

        const updated = normalizeDebtForWrite(baseUpdated);

        const change: SyncChange = {
          table: 'debts',
          action: 'update',
          record_id: updated.id,
          record: updated as unknown as Record<string, unknown>,
          version: nextVersion,
        };

        setState((prev) => ({
          ...prev,
          debts: upsertById(prev.debts, updated),
          pendingChanges: [...prev.pendingChanges, change],
        }));

        await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.debts, state.lastSyncedAt]
  );

  const deleteDebt = useCallback(
    async (id: string) => {
      const existing = state.debts.find((debt) => debt.id === id && !debt.deleted_at);
      if (!existing) return;

        const nextVersion = Math.max(1, existing.version + 1);
        const change: SyncChange = {
          table: 'debts',
          action: 'delete',
          record_id: id,
          version: nextVersion,
        };

        setState((prev) => ({
          ...prev,
          debts: prev.debts.filter((debt) => debt.id !== id),
          pendingChanges: [...prev.pendingChanges, change],
        }));

        await runSync([change], state.lastSyncedAt);
    },
    [runSync, state.debts, state.lastSyncedAt]
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
      addWallet,
      updateWallet,
      archiveWallet,
      addCategory,
      updateCategory,
      deleteCategory,
      addBudget,
      updateBudget,
      deleteBudget,
      addGoal,
      updateGoal,
      deleteGoal,
      addDebt,
      updateDebt,
      deleteDebt,
    }),
    [
      state,
      loading,
      syncing,
      error,
      syncNow,
      addTransaction,
      deleteTransaction,
      addWallet,
      updateWallet,
      archiveWallet,
      addCategory,
      updateCategory,
      deleteCategory,
      addBudget,
      updateBudget,
      deleteBudget,
      addGoal,
      updateGoal,
      deleteGoal,
      addDebt,
      updateDebt,
      deleteDebt,
    ]
  );

  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>;
}

export function useFinanceData() {
  const context = useContext(FinanceDataContext);
  if (!context) throw new Error('useFinanceData must be used within FinanceDataProvider');
  return context;
}
