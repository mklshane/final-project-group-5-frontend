import { useMemo } from 'react';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import { useFinanceData } from '@/context/FinanceDataContext';
import { CURRENCIES } from '@/constants/currencies';
import type { BudgetRecord, CategoryRecord, TransactionRecord } from '@/types/finance';

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

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
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
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

const spendForCategory = (transactions: TransactionRecord[], categoryId: string) => {
  return transactions
    .filter((tx) => tx.type === 'expense' && tx.category_id === categoryId)
    .reduce((sum, tx) => sum + tx.amount, 0);
};

const budgetUtilization = (budgets: BudgetRecord[], transactions: TransactionRecord[]) => {
  return budgets.map((budget) => {
    const spent = spendForCategory(transactions, budget.category_id);
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
    const categoriesById = categoryMap(state.categories);

    const todayTransactions = activeTransactions.filter((tx) => isWithin(tx.date, dayStart, dayEnd));
    const todayExpenses = todayTransactions.filter((tx) => tx.type === 'expense');

    const monthTransactions = activeTransactions.filter((tx) => isWithin(tx.date, monthStart, monthEnd));
    const monthlyExpenseTotal = monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyIncomeTotal = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const recentTransactions = activeTransactions.slice(0, 5).map((tx) => {
      const category = tx.category_id ? categoriesById.get(tx.category_id) : undefined;
      return {
        ...tx,
        categoryName: tx.type === 'income' ? 'Income' : category?.name ?? 'Uncategorized',
        relativeDay: formatRelativeDay(tx.date),
      };
    });

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

    const budgets = budgetUtilization(state.budgets.filter((budget) => !budget.deleted_at), monthTransactions);
    const debtSummary = {
      owedByUser: state.debts
        .filter((debt) => !debt.deleted_at && !debt.is_settled && debt.type === 'owe')
        .reduce((sum, debt) => sum + debt.amount, 0),
      owedToUser: state.debts
        .filter((debt) => !debt.deleted_at && !debt.is_settled && debt.type === 'owed')
        .reduce((sum, debt) => sum + debt.amount, 0),
    };

    return {
      loading,
      syncing,
      error,
      hasData:
        state.transactions.length > 0 ||
        state.categories.length > 0 ||
        state.budgets.length > 0 ||
        state.goals.length > 0 ||
        state.debts.length > 0,
      allTransactions: activeTransactions,
      recentTransactions,
      today: {
        spentTotal: todayExpenses.reduce((sum, tx) => sum + tx.amount, 0),
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
