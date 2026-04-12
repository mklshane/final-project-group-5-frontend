import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { DebtEditorModal } from '@/components/Profile/DebtEditorModal';
import { OwedEntryCard } from '@/components/Profile/ManageMoneyOwed/OwedEntryCard';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import { useTheme } from '@/hooks/useTheme';
import type { DebtRecord } from '@/types/finance';

const debtAmounts = (debt: DebtRecord) => {
  const total = Number.isFinite(debt.total_amount) ? debt.total_amount : debt.amount ?? 0;
  const collected = Number.isFinite(debt.amount_paid) ? debt.amount_paid : 0;
  const remaining = Math.max(0, total - collected);
  return { total, collected, remaining };
};

export default function ManageMoneyOwedToYouScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { state, loading, addDebt, updateDebt, deleteDebt } = useFinanceData();
  const finance = useFinanceSelectors();
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DebtRecord | null>(null);

  const owedEntries = useMemo(
    () => state.debts.filter((debt) => !debt.deleted_at && debt.type === 'owed'),
    [state.debts]
  );

  const activeOwed = useMemo(
    () => owedEntries.filter((debt) => debtAmounts(debt).remaining > 0),
    [owedEntries]
  );
  const collectedOwed = useMemo(
    () => owedEntries.filter((debt) => debtAmounts(debt).remaining <= 0),
    [owedEntries]
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
    counterpartyName: string;
    totalAmount: number;
    amountPaid: number;
    dueDate: string;
    notes?: string;
  }) => {
    if (!selectedDebt) {
      await addDebt({
        type: 'owed',
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
      counterpartyName: input.counterpartyName,
      totalAmount: input.totalAmount,
      amountPaid: input.amountPaid,
      dueDate: input.dueDate,
      notes: input.notes,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDebt(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}> 
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.heroCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
          <Text style={[s.title, { color: theme.text }]}>Money Owed To You</Text>
          <Text style={[s.subtitle, { color: theme.secondary }]}>Stay on top of receivables and expected collection timelines.</Text>

          <View style={s.metricsRow}>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
              <Text style={[s.metricLabel, { color: theme.secondary }]}>OUTSTANDING</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{finance.formatCurrency(finance.debts.totals.owedRemaining)}</Text>
            </View>
            <View style={[s.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
              <Text style={[s.metricLabel, { color: theme.secondary }]}>OPEN ITEMS</Text>
              <Text style={[s.metricValue, { color: theme.text }]}>{activeOwed.length}</Text>
            </View>
          </View>

          <Pressable onPress={openCreate} style={[s.addButton, { backgroundColor: theme.isDark ? theme.lime : '#3F7D36' }]}> 
            <Ionicons name="add" size={18} color={theme.isDark ? theme.bg : '#FFFFFF'} />
            <Text style={[s.addLabel, { color: theme.isDark ? theme.bg : '#FFFFFF' }]}>Add Entry</Text>
          </Pressable>
        </View>

        <Text style={[s.sectionTitle, { color: theme.secondary }]}>ACTIVE</Text>
        {loading ? (
          <View style={[s.loadingCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
            <Text style={{ color: theme.secondary }}>Loading entries...</Text>
          </View>
        ) : activeOwed.length === 0 ? (
          <View style={[s.emptyCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
            <Text style={[s.emptyText, { color: theme.secondary }]}>No active money owed entries yet.</Text>
          </View>
        ) : (
          activeOwed.map((debt) => (
            <OwedEntryCard
              key={debt.id}
              debt={debt}
              formatCurrency={finance.formatCurrency}
              onPressDetails={(entry) => router.push(`/(app)/profile/debt-detail/${entry.id}`)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))
        )}

        {collectedOwed.length > 0 ? (
          <>
            <Text style={[s.sectionTitle, { color: theme.secondary, marginTop: 14 }]}>COLLECTED</Text>
            {collectedOwed.map((debt) => (
              <OwedEntryCard
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
        mode="owed"
        initialDebt={selectedDebt}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        visible={Boolean(deleteTarget)}
        title="Delete entry?"
        message={
          deleteTarget
            ? `Delete entry for "${deleteTarget.counterparty_name ?? deleteTarget.person_name ?? 'Unknown'}"?`
            : 'Delete this entry?'
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
