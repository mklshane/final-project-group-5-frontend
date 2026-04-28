import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BudgetEditorModal } from '@/components/Profile/BudgetEditorModal';
import { CategoryBudgetRow } from '@/components/Profile/CategoryBudgetRow';
import { CategoryEditorModal } from '@/components/Profile/CategoryEditorModal';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useToast } from '@/context/ToastContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';
import type { BudgetPeriod, BudgetRecord, CategoryRecord } from '@/types/finance';

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Annual' },
];

const periodLabel = (period: BudgetPeriod) => PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? 'Monthly';

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const rangeForPeriod = (period: BudgetPeriod, anchor = new Date()) => {
  if (period === 'daily') {
    const start = startOfDay(anchor);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (period === 'weekly') {
    const start = startOfDay(anchor);
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  if (period === 'yearly') {
    const start = new Date(anchor.getFullYear(), 0, 1);
    const end = new Date(anchor.getFullYear() + 1, 0, 1);
    return { start, end };
  }

  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  return { start, end };
};

export default function ManageBudgetsScreen() {
  const theme = useTheme();
  const finance = useFinanceSelectors();
  const { state, loading, addCategory, addBudget, updateBudget } = useFinanceData();
  const toast = useToast();

  const [categoryEditorVisible, setCategoryEditorVisible] = useState(false);
  const [budgetEditorVisible, setBudgetEditorVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRecord | null>(null);

  const activeCategories = useMemo(
    () =>
      state.categories
        .filter((category) => !category.deleted_at && category.type !== 'income')
        .slice()
        .sort((a, b) => {
          const sortDelta = (a.sort_order ?? 0) - (b.sort_order ?? 0);
          if (sortDelta !== 0) return sortDelta;
          return a.name.localeCompare(b.name);
        }),
    [state.categories]
  );

  const activeBudgets = useMemo(() => state.budgets.filter((budget) => !budget.deleted_at), [state.budgets]);

  const budgetsByCategory = useMemo(() => {
    const map = new Map<string, BudgetRecord>();
    for (const budget of activeBudgets) {
      const previous = map.get(budget.category_id);
      if (!previous) {
        map.set(budget.category_id, budget);
        continue;
      }

      const previousTs = new Date(previous.updated_at ?? previous.created_at ?? 0).getTime();
      const currentTs = new Date(budget.updated_at ?? budget.created_at ?? 0).getTime();
      if (currentTs >= previousTs) {
        map.set(budget.category_id, budget);
      }
    }
    return map;
  }, [activeBudgets]);

  const spendingByCategory = useMemo(() => {
    const totals = new Map<string, number>();

    for (const [categoryId, budget] of budgetsByCategory.entries()) {
      const { start, end } = rangeForPeriod(budget.period);
      let spent = 0;

      for (const tx of state.transactions) {
        if (tx.deleted_at || tx.type !== 'expense' || tx.category_id !== categoryId) continue;
        const date = new Date(tx.date);
        if (date >= start && date < end) {
          spent += tx.amount;
        }
      }

      totals.set(categoryId, spent);
    }

    return totals;
  }, [budgetsByCategory, state.transactions]);

  const totals = useMemo(() => {
    return activeCategories.reduce(
      (acc, category) => {
        const budget = budgetsByCategory.get(category.id);
        if (!budget) return acc;
        acc.budgets += 1;
        acc.limits += budget.amount_limit;
        acc.spent += spendingByCategory.get(category.id) ?? 0;
        return acc;
      },
      { budgets: 0, limits: 0, spent: 0 }
    );
  }, [activeCategories, budgetsByCategory, spendingByCategory]);

  const selectedBudget = selectedCategory ? budgetsByCategory.get(selectedCategory.id) ?? null : null;

  const handleAddCategory = async (input: {
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'income' | 'both';
  }) => {
    try {
      const nextType = input.type === 'income' ? 'expense' : input.type;
      await addCategory({ ...input, type: nextType });
      toast.show('Category created', 'success');
    } catch {
      toast.show('Failed to create category', 'error');
    }
  };

  const handleOpenBudgetModal = (category: CategoryRecord) => {
    setSelectedCategory(category);
    setBudgetEditorVisible(true);
  };

  const handleSaveBudget = async (input: { amountLimit: number; period: BudgetPeriod }) => {
    if (!selectedCategory) return;
    try {
      if (selectedBudget) {
        await updateBudget({
          id: selectedBudget.id,
          amountLimit: input.amountLimit,
          period: input.period,
          categoryId: selectedCategory.id,
        });
        toast.show('Budget updated', 'success');
        return;
      }
      await addBudget({
        categoryId: selectedCategory.id,
        amountLimit: input.amountLimit,
        period: input.period,
      });
      toast.show('Budget created', 'success');
    } catch {
      toast.show('Failed to save budget', 'error');
    }
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}> 
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.heroCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
          <Text style={[s.title, { color: theme.text }]}>Category Budgeting</Text>
          <Text style={[s.subtitle, { color: theme.secondary }]}>Assign targeted limits to your expense categories and track progress.</Text>

          <View style={s.metricsRow}>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
              <Text style={[s.metricLabel, { color: theme.secondary }]}>ACTIVE</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{totals.budgets}</Text>
            </View>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
              <Text style={[s.metricLabel, { color: theme.secondary }]}>SPENT</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{finance.formatCurrency(totals.spent)}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setCategoryEditorVisible(true)}
            style={[s.addButton, { backgroundColor: theme.isDark ? theme.lime : '#3F7D36' }]}
          >
            <Ionicons name="add" size={18} color={theme.isDark ? theme.bg : '#FFFFFF'} />
            <Text style={[s.addLabel, { color: theme.isDark ? theme.bg : '#FFFFFF' }]}>Add Category</Text>
          </Pressable>
        </View>

        <Text style={[s.sectionTitle, { color: theme.secondary }]}>CATEGORY BUDGETS</Text>

        {loading ? (
          <View style={[s.stateCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
            <Text style={[s.stateText, { color: theme.secondary }]}>Loading categories...</Text>
          </View>
        ) : activeCategories.length === 0 ? (
          <View style={[s.stateCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
            <Text style={[s.stateText, { color: theme.secondary }]}>No expense categories yet. Add one to start budgeting.</Text>
          </View>
        ) : (
          activeCategories.map((category) => (
            <CategoryBudgetRow
              key={category.id}
              category={category}
              budget={budgetsByCategory.get(category.id) ?? null}
              spent={spendingByCategory.get(category.id) ?? 0}
              periodLabel={periodLabel((budgetsByCategory.get(category.id)?.period ?? 'monthly'))}
              formatCurrency={finance.formatCurrency}
              onPressBudget={handleOpenBudgetModal}
            />
          ))
        )}
      </ScrollView>

      <CategoryEditorModal
        visible={categoryEditorVisible}
        mode="create"
        initialCategory={null}
        onClose={() => setCategoryEditorVisible(false)}
        onSave={handleAddCategory}
      />

      <BudgetEditorModal
        visible={budgetEditorVisible}
        category={selectedCategory}
        initialBudget={selectedBudget}
        defaultPeriod={selectedBudget?.period ?? 'monthly'}
        onClose={() => setBudgetEditorVisible(false)}
        onSave={handleSaveBudget}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addButton: {
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 8,
    paddingLeft: 2,
  },
  stateCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  stateText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
