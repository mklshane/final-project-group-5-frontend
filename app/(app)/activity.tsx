import { useMemo, useState } from 'react';
import { View, Text, SafeAreaView, FlatList } from 'react-native';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { QuickActionFab } from '@/components/Base/QuickActionFab';
import { TransactionCard } from '@/components/Base/TransactionCard';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { TransactionEntryModal } from '@/components/Base/TransactionEntryModal';

export default function ActivityScreen() {
  const { state, addTransaction, deleteTransaction } = useFinanceData();
  const finance = useFinanceSelectors();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<'expense' | 'income'>('expense');
  const [entryVisible, setEntryVisible] = useState(false);
  const [scanRequestId, setScanRequestId] = useState<number | null>(null);

  const deleteTarget = useMemo(
    () => finance.allTransactions.find((tx) => tx.id === deleteTargetId) ?? null,
    [finance.allTransactions, deleteTargetId]
  );

  const handleQuickScan = async () => {
    setEntryMode('expense');
    setScanRequestId(Date.now());
    setEntryVisible(true);
  };

  const handleAddExpense = async () => {
    setEntryMode('expense');
    setScanRequestId(null);
    setEntryVisible(true);
  };

  const handleAddIncome = async () => {
    setEntryMode('income');
    setScanRequestId(null);
    setEntryVisible(true);
  };

  const handleSubmitEntry = async (input: {
    title: string;
    amount: number;
    type: 'expense' | 'income';
    walletId: string | null;
    categoryId: string | null;
  }) => {
    await addTransaction({
      title: input.title,
      amount: input.amount,
      type: input.type,
      walletId: input.walletId,
      categoryId: input.categoryId,
    });
  };

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteTransaction(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <>
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-6 pt-4 pb-3">
          <Text className="text-text text-3xl font-extrabold tracking-tight">Activity</Text>
          <Text className="text-secondary mt-1 text-sm">Recent transactions across all categories.</Text>
        </View>

        {finance.loading ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-secondary text-base">Loading transactions...</Text>
          </View>
        ) : finance.allTransactionsView.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-secondary text-center text-base">No activity yet. Add your first transaction from the Home screen.</Text>
          </View>
        ) : (
          <FlatList
            data={finance.allTransactionsView}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 6 }}
            renderItem={({ item }) => (
              <TransactionCard
                title={item.title}
                categoryName={`${item.categoryName} • ${item.walletName}`}
                categoryIcon={item.categoryIcon}
                categoryColor={item.categoryColor}
                amountLabel={`${item.type === 'income' ? '+' : ''}${finance.formatCurrency(item.amount)}`}
                timeLabel={item.relativeDay}
                kind={item.title.toLowerCase().includes('scan') ? 'scan' : item.type === 'income' ? 'income' : 'expense'}
                onDeletePress={() => requestDelete(item.id)}
              />
            )}
          />
        )}
      </SafeAreaView>

      <ConfirmDeleteModal
        visible={Boolean(deleteTargetId)}
        message={
          deleteTarget
            ? `Delete \"${deleteTarget.title}\"? This action cannot be undone.`
            : 'Delete this transaction? This action cannot be undone.'
        }
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      <QuickActionFab
        onQuickScan={handleQuickScan}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
      />

      <TransactionEntryModal
        visible={entryVisible}
        mode={entryMode}
        scanRequestId={scanRequestId}
        wallets={finance.wallets}
        categories={state.categories}
        onClose={() => {
          setEntryVisible(false);
          setScanRequestId(null);
        }}
        onSubmit={handleSubmitEntry}
      />
    </>
  );
}