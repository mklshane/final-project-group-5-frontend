import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { DebtEditorModal } from '@/components/Profile/DebtEditorModal';
import { DebtEntryCard } from '@/components/Profile/ManageDebt/DebtEntryCard';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';
import type { DebtRecord } from '@/types/finance';

const debtAmounts = (debt: DebtRecord) => {
  const total = Number.isFinite(debt.total_amount) ? debt.total_amount : debt.amount ?? 0;
  const paid = Number.isFinite(debt.amount_paid) ? debt.amount_paid : 0;
  const remaining = Math.max(0, total - paid);
  return { total, paid, remaining };
};

export default function ManageDebtScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { state, loading, addDebt, updateDebt, deleteDebt } = useFinanceData();
  const finance = useFinanceSelectors();
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DebtRecord | null>(null);

  const debts = useMemo(
    () => state.debts.filter((debt) => !debt.deleted_at && debt.type === 'owe'),
    [state.debts]
  );

  const unsettledDebts = useMemo(
    () => debts.filter((debt) => debtAmounts(debt).remaining > 0),
    [debts]
  );
  const settledDebts = useMemo(
    () => debts.filter((debt) => debtAmounts(debt).remaining <= 0),
    [debts]
  );

  const openCreate = () => {
    setSelectedDebt(null);
    setEditorVisible(true);
  };

  const openEdit = (debt: DebtRecord) => {
    setSelectedDebt(debt);
    setEditorVisible(true);
  };

  const handleSave = async (input: {
    counterpartyKind?: 'person' | 'entity' | 'organization';
    counterpartyName: string;
    totalAmount: number;
    amountPaid: number;
    dueDate: string;
    notes?: string;
  }) => {
    if (!selectedDebt) {
      await addDebt({
        type: 'owe',
        counterpartyKind: input.counterpartyKind,
        counterpartyName: input.counterpartyName,
        totalAmount: input.totalAmount,
        amountPaid: input.amountPaid,
        dueDate: input.dueDate,
        notes: input.notes,
      });
      return;
    }

    await updateDebt({
      id: selectedDebt.id,
      counterpartyKind: input.counterpartyKind,
      counterpartyName: input.counterpartyName,
      totalAmount: input.totalAmount,
      amountPaid: input.amountPaid,
      dueDate: input.dueDate,
      notes: input.notes,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    await deleteDebt(targetId);
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}> 
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.heroCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
          <Text style={[s.title, { color: theme.text }]}>Debt</Text>
          <Text style={[s.subtitle, { color: theme.secondary }]}>Track balances, keep due dates visible, and manage payment progress.</Text>

          <View style={s.metricsRow}>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
              <Text style={[s.metricLabel, { color: theme.secondary }]}>REMAINING</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{finance.formatCurrency(finance.debts.totals.oweRemaining)}</Text>
            </View>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
              <Text style={[s.metricLabel, { color: theme.secondary }]}>OPEN ITEMS</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{unsettledDebts.length}</Text>
            </View>
          </View>

          <Pressable onPress={openCreate} style={[s.addButton, { backgroundColor: theme.isDark ? theme.lime : '#3F7D36' }]}> 
            <Ionicons name="add" size={18} color={theme.isDark ? theme.bg : '#FFFFFF'} />
            <Text style={[s.addLabel, { color: theme.isDark ? theme.bg : '#FFFFFF' }]}>Add Debt</Text>
          </Pressable>
        </View>

        <Text style={[s.sectionTitle, { color: theme.secondary }]}>ACTIVE</Text>
        {loading ? (
          <View style={[s.loadingCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
            <Text style={{ color: theme.secondary }}>Loading debt entries...</Text>
          </View>
        ) : unsettledDebts.length === 0 ? (
          <View style={[s.emptyCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
            <Text style={[s.emptyText, { color: theme.secondary }]}>No active debt entries yet.</Text>
          </View>
        ) : (
          unsettledDebts.map((debt) => (
            <DebtEntryCard
              key={debt.id}
              debt={debt}
              formatCurrency={finance.formatCurrency}
              onPressDetails={(entry) => router.push(`/(app)/profile/debt-detail/${entry.id}`)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))
        )}

        {settledDebts.length > 0 ? (
          <>
            <Text style={[s.sectionTitle, { color: theme.secondary, marginTop: 14 }]}>SETTLED</Text>
            {settledDebts.map((debt) => (
              <DebtEntryCard
                key={debt.id}
                debt={debt}
                formatCurrency={finance.formatCurrency}
                onPressDetails={(entry) => router.push(`/(app)/profile/debt-detail/${entry.id}`)}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <DebtEditorModal
        visible={editorVisible}
        mode="owe"
        initialDebt={selectedDebt}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        visible={Boolean(deleteTarget)}
        title="Delete debt entry?"
        message={
          deleteTarget
            ? `Delete debt entry for "${deleteTarget.counterparty_name ?? deleteTarget.person_name ?? 'Unknown'}"?`
            : 'Delete this debt entry?'
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDelete();
        }}
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
  loadingCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
