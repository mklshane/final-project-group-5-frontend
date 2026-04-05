import { View, Text, SafeAreaView, FlatList } from 'react-native';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';

export default function ActivityScreen() {
  const finance = useFinanceSelectors();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 pt-4 pb-3">
        <Text className="text-text text-3xl font-extrabold tracking-tight">Activity</Text>
        <Text className="text-text-sub mt-1 text-sm">Recent transactions across all categories.</Text>
      </View>

      {finance.loading ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-sub text-base">Loading transactions...</Text>
        </View>
      ) : finance.allTransactions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-sub text-center text-base">No activity yet. Add your first transaction from the Home screen.</Text>
        </View>
      ) : (
        <FlatList
          data={finance.allTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 12 }}
          renderItem={({ item }) => (
            <View className="rounded-2xl border border-card-deep bg-card px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-text text-base font-bold">{item.title}</Text>
                <Text className={`text-base font-extrabold ${item.type === 'income' ? 'text-green-500' : 'text-text'}`}>
                  {item.type === 'income' ? '+' : ''}
                  {finance.formatCurrency(item.amount)}
                </Text>
              </View>
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-text-sub text-xs">{new Date(item.date).toLocaleDateString()}</Text>
                <Text className="text-text-sub text-xs">{item.type === 'income' ? 'Income' : 'Expense'}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}