import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import { DebtEditorModal } from '@/components/Profile/DebtEditorModal';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import type { DebtRecord } from '@/types/finance';

const debtAmounts = (debt: DebtRecord) => {
  const total = Number.isFinite(debt.total_amount) ? debt.total_amount : debt.amount ?? 0;
  const collected = Number.isFinite(debt.amount_paid) ? debt.amount_paid : 0;
  const remaining = Math.max(0, total - collected);
  return { total, collected, remaining };
};

export default function ManageMoneyOwedToYouScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { state, loading, addDebt, updateDebt, deleteDebt } = useFinanceData();
  const finance = useFinanceSelectors();
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DebtRecord | null>(null);

  const isDark = colorScheme === 'dark';
  const palette = {
    screenBg: isDark ? '#111410' : '#F4F5E9',
    heading: isDark ? '#EDF0E4' : '#1A1E14',
    sub: isDark ? '#8A8F7C' : '#6B7060',
    addBg: isDark ? '#C8F560' : '#1A1E14',
    addText: isDark ? '#1A1E14' : '#C8F560',
    border: isDark ? '#2C3122' : '#E4E6D6',
    cardBg: isDark ? '#1A1E14' : '#FFFFFF',
  };

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

  const renderOwedCard = (debt: DebtRecord) => {
    const { total, collected, remaining } = debtAmounts(debt);
    return (
      <View key={debt.id} style={[s.debtCard, { backgroundColor: palette.cardBg, borderColor: palette.border }]}>
        <View style={s.debtTopRow}>
          <View style={s.debtTitleWrap}>
            <Text style={[s.debtTitle, { color: palette.heading }]} numberOfLines={1}>
              {debt.counterparty_name ?? debt.person_name ?? 'Unknown'}
            </Text>
            <Text style={[s.debtMeta, { color: palette.sub }]} numberOfLines={1}>
              Expected by {debt.due_date || 'N/A'}
            </Text>
          </View>
          <Text style={[s.debtRemaining, { color: remaining > 0 ? '#D9534F' : '#3E8C3E' }]}>
            {finance.formatCurrency(remaining)}
          </Text>
        </View>

        <Text style={[s.debtNumbers, { color: palette.sub }]}>
          Collected {finance.formatCurrency(collected)} / {finance.formatCurrency(total)}
        </Text>

        {debt.notes ? (
          <Text style={[s.debtNote, { color: palette.sub }]} numberOfLines={2}>
            {debt.notes}
          </Text>
        ) : null}

        <View style={s.debtActions}>
          <Pressable
            onPress={() => router.push(`/(app)/profile/debt-detail/${debt.id}`)}
            style={[s.inlineButton, { borderColor: palette.border }]}
          >
            <Text style={[s.inlineLabel, { color: palette.heading }]}>Details</Text>
          </Pressable>
          <Pressable onPress={() => openEdit(debt)} style={[s.inlineButton, { borderColor: palette.border }]}>
            <Text style={[s.inlineLabel, { color: palette.heading }]}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => setDeleteTarget(debt)} style={[s.inlineButton, { borderColor: palette.border }]}>
            <Text style={[s.inlineLabel, { color: '#D9534F' }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: palette.screenBg }]}> 
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: palette.heading }]}>Manage money owed to you</Text>
          <Text style={[s.subtitle, { color: palette.sub }]}>Track collections, expected dates, and remaining amounts.</Text>
        </View>

        <View style={[s.summaryCard, { backgroundColor: palette.cardBg, borderColor: palette.border }]}> 
          <Text style={[s.summaryLabel, { color: palette.sub }]}>TOTAL REMAINING</Text>
          <Text style={[s.summaryAmount, { color: palette.heading }]}>{finance.formatCurrency(finance.debts.totals.owedRemaining)}</Text>
        </View>

        <Pressable onPress={openCreate} style={[s.addButton, { backgroundColor: palette.addBg }]}> 
          <Ionicons name="add" size={18} color={palette.addText} />
          <Text style={[s.addLabel, { color: palette.addText }]}>Add Entry</Text>
        </Pressable>

        <Text style={[s.sectionTitle, { color: palette.sub }]}>ACTIVE</Text>
        {loading ? (
          <View style={[s.loadingCard, { borderColor: palette.border, backgroundColor: palette.cardBg }]}> 
            <Text style={{ color: palette.sub }}>Loading entries...</Text>
          </View>
        ) : activeOwed.length === 0 ? (
          <View style={[s.emptyCard, { borderColor: palette.border, backgroundColor: palette.cardBg }]}> 
            <Text style={[s.emptyText, { color: palette.sub }]}>No active money owed entries yet.</Text>
          </View>
        ) : (
          activeOwed.map(renderOwedCard)
        )}

        {collectedOwed.length > 0 ? (
          <>
            <Text style={[s.sectionTitle, { color: palette.sub, marginTop: 16 }]}>COLLECTED</Text>
            {collectedOwed.map(renderOwedCard)}
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    maxWidth: 340,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  addButton: {
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  addLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  debtCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  debtTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  debtTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  debtTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  debtMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  debtRemaining: {
    fontSize: 13,
    fontWeight: '800',
  },
  debtNumbers: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  debtNote: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 17,
  },
  debtActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  inlineButton: {
    borderWidth: 1,
    borderRadius: 10,
    height: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
