import { useMemo } from 'react';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import { useFinanceData } from '@/context/FinanceDataContext';
import { CURRENCIES } from '@/constants/currencies';
import { FALLBACK_CATEGORY_VISUALS, getDefaultTemplateByName } from '@/constants/defaultCategories';
import { WALLET_TYPE_LABELS } from '@/constants/defaultWallets';
import type { BudgetPeriod, BudgetRecord, CategoryRecord, TransactionRecord, WalletRecord } from '@/types/finance';

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

const startOfWeek = (date: Date) => {
  const copy = startOfDay(date);
  const daysSinceMonday = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - daysSinceMonday);
  return copy;
};

const budgetPeriodRange = (period: BudgetPeriod, anchor = new Date()) => {
  if (period === 'daily') {
    const start = startOfDay(anchor);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (period === 'weekly') {
    const start = startOfWeek(anchor);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  if (period === 'yearly') {
    const start = startOfYear(anchor);
    const end = new Date(start.getFullYear() + 1, 0, 1);
    return { start, end };
  }

  const start = startOfMonth(anchor);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return { start, end };
};

const isWithin = (value: string, start: Date, end: Date) => {
  const current = new Date(value);
  return current >= start && current < end;
};

const formatRelativeDay = (value: string) => {
  const current = new Date(value);
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const currentDay = startOfDay(current).getTime();
  if (currentDay === today.getTime()) return 'Today';
  if (currentDay === yesterday.getTime()) return 'Yesterday';

  return current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const currencySymbol = (currencyCode: string) => {
  const match = CURRENCIES.find((currency) => currency.code === currencyCode);
  return match?.symbol ?? '₱';
};

const categoryMap = (categories: CategoryRecord[]) => {
  const map = new Map<string, CategoryRecord>();
  for (const category of categories) map.set(category.id, category);
  return map;
};

const walletMap = (wallets: WalletRecord[]) => {
  const map = new Map<string, WalletRecord>();
  for (const wallet of wallets) map.set(wallet.id, wallet);
  return map;
};

const spendForCategory = (transactions: TransactionRecord[], categoryId: string, period: BudgetPeriod) => {
  const { start, end } = budgetPeriodRange(period);
  return transactions
    .filter((tx) => tx.type === 'expense' && tx.category_id === categoryId && isWithin(tx.date, start, end))
    .reduce((sum, tx) => sum + tx.amount, 0);
};

const budgetUtilization = (budgets: BudgetRecord[], transactions: TransactionRecord[]) => {
  return budgets.map((budget) => {
    const spent = spendForCategory(transactions, budget.category_id, budget.period);
    const limit = budget.amount_limit || 0;
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return {
      budget,
      spent,
      remaining: Math.max(0, limit - spent),
      percentage,
      overLimit: spent > limit,
    };
  });
};

export function useFinanceSelectors() {
  const { state, loading, syncing, error } = useFinanceData();
  const { currencyCode } = useAppPreferences();

  const symbol = useMemo(() => currencySymbol(currencyCode), [currencyCode]);

  return useMemo(() => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const monthStart = startOfMonth(now);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

    const activeTransactions = state.transactions
      .filter((tx) => !tx.deleted_at)
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const activeWallets = state.wallets
      .filter((wallet) => !wallet.deleted_at)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const categoriesById = categoryMap(state.categories);
    const walletsById = walletMap(activeWallets);

    const decoratedTransactions = activeTransactions.map((tx) => {
      const category = tx.category_id ? categoriesById.get(tx.category_id) : undefined;
      const wallet = tx.wallet_id ? walletsById.get(tx.wallet_id) : undefined;
      const template = getDefaultTemplateByName(category?.name);
      const categoryVisual = tx.type === 'income' ? FALLBACK_CATEGORY_VISUALS.income : FALLBACK_CATEGORY_VISUALS.expense;

      return {
        ...tx,
        categoryName: tx.type === 'income' ? 'Income' : category?.name ?? categoryVisual.name,
        categoryIcon: category?.icon ?? template?.icon ?? categoryVisual.icon,
        categoryColor: category?.color ?? template?.color ?? categoryVisual.color,
        walletName: wallet?.name ?? 'General',
        relativeDay: formatRelativeDay(tx.date),
      };
    });

    const todayTransactions = activeTransactions.filter((tx) => isWithin(tx.date, dayStart, dayEnd));
    const todayExpenses = todayTransactions.filter((tx) => tx.type === 'expense');
    const todayIncome = todayTransactions.filter((tx) => tx.type === 'income');

    const monthTransactions = activeTransactions.filter((tx) => isWithin(tx.date, monthStart, monthEnd));
    const monthlyExpenseTotal = monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyIncomeTotal = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const recentTransactions = decoratedTransactions.slice(0, 5);

    const categorySpendTotals = new Map<string, number>();
    for (const tx of monthTransactions) {
      if (tx.type !== 'expense') continue;
      const key = tx.category_id ?? 'uncategorized';
      categorySpendTotals.set(key, (categorySpendTotals.get(key) ?? 0) + tx.amount);
    }

    const categoryBreakdown = [...categorySpendTotals.entries()]
      .map(([key, total]) => ({
        id: key,
        label: key === 'uncategorized' ? 'Uncategorized' : categoriesById.get(key)?.name ?? 'Uncategorized',
        total,
        percentage: monthlyExpenseTotal > 0 ? Math.round((total / monthlyExpenseTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const budgets = budgetUtilization(state.budgets.filter((budget) => !budget.deleted_at), activeTransactions);
    const activeDebts = state.debts.filter((debt) => !debt.deleted_at);
    const debtRows = activeDebts.map((debt) => {
      const totalAmount = Number.isFinite(debt.total_amount) ? debt.total_amount : debt.amount ?? 0;
      const amountPaid = Number.isFinite(debt.amount_paid) ? debt.amount_paid : 0;
      const remainingAmount = Math.max(0, totalAmount - amountPaid);

      return {
        ...debt,
        totalAmount,
        amountPaid,
        remainingAmount,
      };
    });

    const unsettledDebtRows = debtRows.filter((debt) => debt.remainingAmount > 0);
    const oweRows = debtRows.filter((debt) => debt.type === 'owe');
    const owedRows = debtRows.filter((debt) => debt.type === 'owed');
    const unsettledOweRows = unsettledDebtRows.filter((debt) => debt.type === 'owe');
    const unsettledOwedRows = unsettledDebtRows.filter((debt) => debt.type === 'owed');

    const debtSummary = {
      owedByUser: unsettledOweRows.reduce((sum, debt) => sum + debt.remainingAmount, 0),
      owedToUser: unsettledOwedRows.reduce((sum, debt) => sum + debt.remainingAmount, 0),
      totals: {
        oweTotal: oweRows.reduce((sum, debt) => sum + debt.totalAmount, 0),
        owePaid: oweRows.reduce((sum, debt) => sum + debt.amountPaid, 0),
        oweRemaining: unsettledOweRows.reduce((sum, debt) => sum + debt.remainingAmount, 0),
        owedTotal: owedRows.reduce((sum, debt) => sum + debt.totalAmount, 0),
        owedCollected: owedRows.reduce((sum, debt) => sum + debt.amountPaid, 0),
        owedRemaining: unsettledOwedRows.reduce((sum, debt) => sum + debt.remainingAmount, 0),
      },
      lists: {
        owe: oweRows,
        owed: owedRows,
        unsettledOwe: unsettledOweRows,
        unsettledOwed: unsettledOwedRows,
      },
    };
      const totalWalletBalance = activeWallets.reduce((sum, wallet) => sum + wallet.current_balance, 0);

    return {
      loading,
      syncing,
      error,
      hasData:
        state.transactions.length > 0 ||
        state.categories.length > 0 ||
        state.wallets.length > 0 ||
        state.budgets.length > 0 ||
        state.goals.length > 0 ||
        state.debts.length > 0,
      wallets: activeWallets.map((wallet) => ({
        ...wallet,
        typeLabel: WALLET_TYPE_LABELS[wallet.type],
      })),
      balances: {
        total: totalWalletBalance,
      },
      allTransactions: activeTransactions,
      allTransactionsView: decoratedTransactions,
      recentTransactions,
      today: {
        spentTotal: todayExpenses.reduce((sum, tx) => sum + tx.amount, 0),
        incomeTotal: todayIncome.reduce((sum, tx) => sum + tx.amount, 0),
        transactionsCount: todayTransactions.length,
      },
      month: {
        spentTotal: monthlyExpenseTotal,
        incomeTotal: monthlyIncomeTotal,
        netFlow: monthlyIncomeTotal - monthlyExpenseTotal,
      },
      insights: {
        categoryBreakdown,
        budgetUtilization: budgets,
      },
      goals: state.goals.filter((goal) => !goal.deleted_at),
      debts: debtSummary,
      formatCurrency: (value: number) => `${value < 0 ? '-' : ''}${symbol}${numberFormatter.format(Math.abs(value))}`,
    };
  }, [symbol, loading, syncing, error, state]);
}
