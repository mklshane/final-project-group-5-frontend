import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SYSTEM_CATEGORIES } from '@/constants/defaultCategories';
import { DEFAULT_WALLET } from '@/constants/defaultWallets';
import { useAuth } from '@/context/AuthContext';
import type {
  BudgetRecord,
  CategoryRecord,
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
    return { ...state, categories: upsertById(state.categories, toCategory(change.record)) };
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

const createDefaultWalletRecord = (userId: string): WalletRecord => {
  const timestamp = nowIso();
  return {
    id: createId(),
    user_id: userId,
    name: DEFAULT_WALLET.name,
    type: DEFAULT_WALLET.type,
    institution_name: null,
    opening_balance: 0,
    current_balance: 0,
    is_default: DEFAULT_WALLET.isDefault,
    sort_order: DEFAULT_WALLET.sortOrder,
    version: 1,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
  };
};

export function FinanceDataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<FinanceDataState>(defaultFinanceState);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [defaultsSeededForUserId, setDefaultsSeededForUserId] = useState<string | null>(null);
  const [walletsSeededForUserId, setWalletsSeededForUserId] = useState<string | null>(null);

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
      setDefaultsSeededForUserId(null);
      setWalletsSeededForUserId(null);
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
    if (!session || loading) return;
    if (defaultsSeededForUserId === session.user.id) return;
    if (state.categories.length > 0) {
      setDefaultsSeededForUserId(session.user.id);
      return;
    }

    const defaultRecords = createDefaultCategoryRecords(session.user.id);
    const defaultChanges: SyncChange[] = defaultRecords.map((record) => ({
      table: 'categories',
      action: 'create',
      record_id: record.id,
      record: record as unknown as Record<string, unknown>,
      version: record.version,
    }));

    setState((prev) => ({
      ...prev,
      categories: defaultRecords,
      pendingChanges: [...prev.pendingChanges, ...defaultChanges],
    }));
    setDefaultsSeededForUserId(session.user.id);

    void runSync(defaultChanges, state.lastSyncedAt);
  }, [defaultsSeededForUserId, loading, runSync, session, state.categories.length, state.lastSyncedAt]);

  useEffect(() => {
    if (!session || loading) return;
    if (walletsSeededForUserId === session.user.id) return;
    if (state.wallets.length > 0) {
      setWalletsSeededForUserId(session.user.id);
      return;
    }

    const defaultWallet = createDefaultWalletRecord(session.user.id);
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
  }, [walletsSeededForUserId, loading, runSync, session, state.lastSyncedAt, state.wallets.length]);

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
        created_at: date,
        updated_at: date,
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
            updated_at: date,
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

      const syncChanges = walletChange ? [change, walletChange] : [change];

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
    ]
  );

  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>;
}

export function useFinanceData() {
  const context = useContext(FinanceDataContext);
  if (!context) throw new Error('useFinanceData must be used within FinanceDataProvider');
  return context;
}
