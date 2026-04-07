import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaymentLogModal } from '@/components/Profile/PaymentLogModal';
import { useTheme } from '@/hooks/useTheme';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';

const toDateLabel = (value: string) => {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function DebtDetailScreen() {
  const theme = useTheme();
  const { state, updateDebt } = useFinanceData();
  const finance = useFinanceSelectors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const [paymentVisible, setPaymentVisible] = useState(false);

  const debtId = useMemo(() => {
    if (!params.id) return '';
    return Array.isArray(params.id) ? params.id[0] ?? '' : params.id;
  }, [params.id]);

  const debt = useMemo(
    () => state.debts.find((entry) => !entry.deleted_at && entry.id === debtId) ?? null,
    [state.debts, debtId]
  );

  if (!debt) {
    return (
      <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}> 
        <View style={s.emptyWrap}>
          <Text style={[s.emptyTitle, { color: theme.text }]}>Debt entry not found</Text>
          <Text style={[s.emptyBody, { color: theme.secondary }]}>This entry may have been deleted or moved.</Text>
          <Pressable onPress={() => router.back()} style={[s.backButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
            <Text style={[s.backLabel, { color: theme.text }]}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const totalAmount = Number.isFinite(debt.total_amount) ? debt.total_amount : debt.amount ?? 0;
  const paidAmount = Number.isFinite(debt.amount_paid) ? debt.amount_paid : 0;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const progress = totalAmount > 0 ? Math.max(0, Math.min(100, Math.round((paidAmount / totalAmount) * 100))) : 0;
  const isOwe = debt.type === 'owe';
  const paidLabel = isOwe ? 'Paid' : 'Collected';
  const remainingLabel = 'Remaining';
  const dateLabel = isOwe ? 'Due date' : 'Expected by';
  const statusLabel = remainingAmount <= 0 ? (isOwe ? 'Paid' : 'Collected') : 'Active';

  const savePayment = async (input: { amount: number; date: string }) => {
    const nextPaid = Math.min(totalAmount, paidAmount + input.amount);
    await updateDebt({
      id: debt.id,
      amountPaid: nextPaid,
      dueDate: debt.due_date,
      notes: debt.notes ?? undefined,
    });
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}> 
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: theme.text }]} numberOfLines={2}>
            {debt.counterparty_name ?? debt.person_name ?? 'Unknown'}
          </Text>
          <View style={s.metaRow}>
            <Text style={[s.metaText, { color: theme.secondary }]}>{isOwe ? 'You Owe' : 'Owed To You'}</Text>
            <Text style={[s.metaDot, { color: theme.secondary }]}>•</Text>
            <Text style={[s.metaText, { color: theme.secondary }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={[s.balanceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[s.balanceLabel, { color: theme.secondary }]}>{remainingLabel.toUpperCase()}</Text>
          <Text style={[s.balanceAmount, { color: theme.text }]}>{finance.formatCurrency(remainingAmount)}</Text>

          <View style={s.balanceRow}>
            <Text style={[s.balanceMeta, { color: theme.secondary }]}>{paidLabel}</Text>
            <Text style={[s.balanceMetaValue, { color: theme.text }]}>{finance.formatCurrency(paidAmount)}</Text>
          </View>

          <View style={s.balanceRow}>
            <Text style={[s.balanceMeta, { color: theme.secondary }]}>Total</Text>
            <Text style={[s.balanceMetaValue, { color: theme.text }]}>{finance.formatCurrency(totalAmount)}</Text>
          </View>

          {paidAmount > 0 && totalAmount > 0 ? (
            <>
              <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}> 
                <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: theme.lime }]} />
              </View>
              <Text style={[s.progressLabel, { color: theme.secondary }]}>{progress}% completed</Text>
            </>
          ) : null}
        </View>

        <View style={[s.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          {isOwe ? (
            <View style={s.infoRow}>
              <Text style={[s.infoKey, { color: theme.secondary }]}>Type</Text>
              <Text style={[s.infoValue, { color: theme.text }]}>{(debt.counterparty_kind ?? 'person').toUpperCase()}</Text>
            </View>
          ) : null}

          <View style={s.infoRow}>
            <Text style={[s.infoKey, { color: theme.secondary }]}>{dateLabel}</Text>
            <Text style={[s.infoValue, { color: theme.text }]}>{toDateLabel(debt.due_date)}</Text>
          </View>

          <View style={s.infoRowLast}>
            <Text style={[s.infoKey, { color: theme.secondary }]}>Notes</Text>
            <Text style={[s.infoValue, { color: theme.text }]}>{debt.notes?.trim() ? debt.notes : 'No notes'}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setPaymentVisible(true)}
          disabled={remainingAmount <= 0}
          style={[
            s.logButton,
            {
              backgroundColor: remainingAmount <= 0 ? theme.surfaceAlt : theme.lime,
              borderColor: remainingAmount <= 0 ? theme.border : theme.lime,
            },
          ]}
        >
          <Ionicons name="cash-outline" size={16} color={remainingAmount <= 0 ? theme.secondary : theme.bg} />
          <Text style={[s.logButtonText, { color: remainingAmount <= 0 ? theme.secondary : theme.bg }]}> 
            {isOwe ? 'Log Payment' : 'Log Collection'}
          </Text>
        </Pressable>
      </ScrollView>

      <PaymentLogModal
        visible={paymentVisible}
        mode={debt.type}
        maxAmount={remainingAmount}
        onClose={() => setPaymentVisible(false)}
        onSave={savePayment}
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
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaDot: {
    fontSize: 12,
    fontWeight: '700',
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  balanceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceMetaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    marginTop: 10,
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(140,148,124,0.32)',
  },
  infoRowLast: {
    paddingVertical: 10,
  },
  infoKey: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  logButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    height: 42,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
