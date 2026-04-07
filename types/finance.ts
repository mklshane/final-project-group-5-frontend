export type SyncTable = 'transactions' | 'categories' | 'budgets' | 'goals' | 'debts' | 'wallets';
export type SyncAction = 'create' | 'update' | 'delete';

export type WalletType = 'general' | 'bank' | 'ewallet' | 'cash';
export type DebtCounterpartyKind = 'person' | 'entity' | 'organization';

export interface SyncChange {
  table: SyncTable;
  action: SyncAction;
  record?: Record<string, unknown>;
  record_id?: string;
  version: number;
}

export interface SyncResponse {
  synced_at: string;
  acknowledged: string[];
  conflicts: Array<{
    table: SyncTable;
    record_id: string;
    client_version: number;
    server_version: number;
    server_record: Record<string, unknown>;
  }>;
  server_changes: SyncChange[];
}

export interface TransactionRecord {
  id: string;
  user_id?: string;
  type: 'expense' | 'income';
  amount: number;
  title: string;
  wallet_id?: string | null;
  category_id: string | null;
  date: string;
  note?: string | null;
  is_recurring?: boolean;
  recurring_interval?: string | null;
  version: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CategoryRecord {
  id: string;
  user_id?: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type?: 'expense' | 'income' | 'both';
  is_default?: boolean;
  sort_order?: number;
  version: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface BudgetRecord {
  id: string;
  user_id?: string;
  category_id: string;
  amount_limit: number;
  period: 'weekly' | 'monthly';
  alert_threshold?: number;
  version: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface GoalRecord {
  id: string;
  user_id?: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  deadline?: string | null;
  version: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DebtRecord {
  id: string;
  user_id?: string;
  counterparty_kind?: DebtCounterpartyKind;
  counterparty_name: string;
  total_amount: number;
  amount_paid: number;
  due_date: string;
  type: 'owe' | 'owed';
  notes?: string | null;
  // Backward compatibility with older records.
  person_name?: string;
  amount?: number;
  description?: string | null;
  is_settled?: boolean;
  settled_at?: string | null;
  version: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface WalletRecord {
  id: string;
  user_id?: string;
  name: string;
  type: WalletType;
  institution_name?: string | null;
  opening_balance?: number;
  current_balance: number;
  is_default?: boolean;
  sort_order?: number;
  version: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
