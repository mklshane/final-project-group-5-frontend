import { ScrollView, View, Text, SafeAreaView } from 'react-native';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';

export default function InsightsScreen() {
  const finance = useFinanceSelectors();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28, gap: 12 }}>
        <Text className="text-text text-3xl font-extrabold tracking-tight">Insights</Text>

        <View className="rounded-3xl bg-card px-4 py-4">
          <Text className="text-secondary text-xs font-bold tracking-widest">THIS MONTH</Text>
          <Text className="text-text mt-2 text-base font-semibold">Spent: {finance.formatCurrency(finance.month.spentTotal)}</Text>
          <Text className="text-text mt-1 text-base font-semibold">Income: {finance.formatCurrency(finance.month.incomeTotal)}</Text>
          <Text className="mt-1 text-base font-semibold text-budgy-lime-dark">Net flow: {finance.formatCurrency(finance.month.netFlow)}</Text>
        </View>

        <View className="rounded-3xl bg-card px-4 py-4">
          <Text className="text-secondary text-xs font-bold tracking-widest">BUDGET UTILIZATION</Text>
          {finance.insights.budgetUtilization.length === 0 ? (
            <Text className="text-secondary mt-2 text-sm">No budgets available yet.</Text>
          ) : (
            finance.insights.budgetUtilization.slice(0, 4).map((entry) => (
              <View key={entry.budget.id} className="mt-3">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-text text-sm font-semibold">Category</Text>
                  <Text className={`text-sm font-bold ${entry.overLimit ? 'text-red-500' : 'text-secondary'}`}>
                    {entry.percentage}%
                  </Text>
                </View>
                <Text className="text-secondary text-xs">
                  {finance.formatCurrency(entry.spent)} / {finance.formatCurrency(entry.budget.amount_limit)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View className="rounded-3xl bg-card px-4 py-4">
          <Text className="text-secondary text-xs font-bold tracking-widest">CATEGORY BREAKDOWN</Text>
          {finance.insights.categoryBreakdown.length === 0 ? (
            <Text className="text-secondary mt-2 text-sm">No expense data this month yet.</Text>
          ) : (
            finance.insights.categoryBreakdown.slice(0, 5).map((entry) => (
              <View key={entry.id} className="mt-3 flex-row items-center justify-between">
                <Text className="text-text text-sm font-semibold">{entry.label}</Text>
                <Text className="text-secondary text-sm">{entry.percentage}%</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}