import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
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

  const personName = debt?.counterparty_name ?? debt?.person_name ?? 'Unknown';

  if (!debt) {
    return (
      <>
        <Stack.Screen options={{ title: 'Debt Details' }} />
        <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
          <View style={s.emptyWrap}>
            <Text style={[s.emptyTitle, { color: theme.text }]}>Debt entry not found</Text>
            <Text style={[s.emptyBody, { color: theme.secondary }]}>
              This entry may have been deleted or moved.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={[s.backButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
            >
              <Text style={[s.backLabel, { color: theme.text }]}>Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const totalAmount = Number.isFinite(debt.total_amount) ? debt.total_amount : debt.amount ?? 0;
  const paidAmount = Number.isFinite(debt.amount_paid) ? debt.amount_paid : 0;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const progress = totalAmount > 0 ? Math.max(0, Math.min(100, Math.round((paidAmount / totalAmount) * 100))) : 0;
  const isOwe = debt.type === 'owe';
  const isSettled = remainingAmount <= 0;

  const paidLabel = isOwe ? 'Paid' : 'Collected';
  const dateLabel = isOwe ? 'Due Date' : 'Expected By';
  const directionLabel = isOwe ? `You owe ${personName}` : `${personName} owes you`;
  const statusLabel = isSettled ? (isOwe ? 'Settled' : 'Collected') : 'Active';

  const accentColor = isOwe ? theme.orange : theme.green;
  const accentBg = isOwe ? 'rgba(255,173,92,0.12)' : 'rgba(61,217,123,0.12)';
  const directionIcon: React.ComponentProps<typeof Ionicons>['name'] = isOwe
    ? 'arrow-up-circle'
    : 'arrow-down-circle';

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
    <>
      <Stack.Screen options={{ title: personName }} />
      <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Direction + status pills */}
          <View style={s.pillRow}>
            <View style={[s.directionPill, { backgroundColor: accentBg }]}>
              <Ionicons name={directionIcon} size={13} color={accentColor} />
              <Text style={[s.directionPillText, { color: accentColor }]}>{directionLabel}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: isSettled ? 'rgba(61,217,123,0.12)' : theme.surfaceDeep }]}>
              <Text style={[s.statusPillText, { color: isSettled ? theme.green : theme.secondary }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Balance card */}
          <View style={[s.balanceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.balanceLabel, { color: theme.secondary }]}>REMAINING</Text>
            <Text style={[s.balanceAmount, { color: theme.text }]}>{finance.formatCurrency(remainingAmount)}</Text>

            <View style={[s.divider, { backgroundColor: theme.border }]} />

            <View style={s.balanceRow}>
              <Text style={[s.balanceMeta, { color: theme.secondary }]}>{paidLabel}</Text>
              <Text style={[s.balanceMetaValue, { color: theme.text }]}>{finance.formatCurrency(paidAmount)}</Text>
            </View>
            <View style={s.balanceRow}>
              <Text style={[s.balanceMeta, { color: theme.secondary }]}>Total</Text>
              <Text style={[s.balanceMetaValue, { color: theme.text }]}>{finance.formatCurrency(totalAmount)}</Text>
            </View>

            {paidAmount > 0 && totalAmount > 0 ? (
              <View style={s.progressSection}>
                <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}>
                  <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
                </View>
                <Text style={[s.progressLabel, { color: theme.tertiary }]}>
                  {progress}% {isOwe ? 'paid' : 'collected'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Details — iOS settings-style rows */}
          <View style={[s.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[s.infoRow, { borderBottomColor: theme.border }]}>
              <View style={s.infoLeft}>
                <Ionicons name="calendar-outline" size={15} color={theme.tertiary} />
                <Text style={[s.infoKey, { color: theme.secondary }]}>{dateLabel}</Text>
              </View>
              <Text style={[s.infoValue, { color: theme.text }]}>{toDateLabel(debt.due_date)}</Text>
            </View>

            {isOwe ? (
              <View style={[s.infoRow, { borderBottomColor: theme.border }]}>
                <View style={s.infoLeft}>
                  <Ionicons name="person-outline" size={15} color={theme.tertiary} />
                  <Text style={[s.infoKey, { color: theme.secondary }]}>Type</Text>
                </View>
                <Text style={[s.infoValue, { color: theme.text }]}>
                  {(debt.counterparty_kind ?? 'person').charAt(0).toUpperCase() +
                    (debt.counterparty_kind ?? 'person').slice(1)}
                </Text>
              </View>
            ) : null}

            <View style={s.infoRowLast}>
              <View style={s.infoLeft}>
                <Ionicons name="document-text-outline" size={15} color={theme.tertiary} />
                <Text style={[s.infoKey, { color: theme.secondary }]}>Notes</Text>
              </View>
              <Text
                style={[
                  s.infoValue,
                  { color: debt.notes?.trim() ? theme.text : theme.tertiary },
                ]}
              >
                {debt.notes?.trim() ? debt.notes : 'No notes'}
              </Text>
            </View>
          </View>

          {/* Primary action */}
          <Pressable
            onPress={() => setPaymentVisible(true)}
            disabled={isSettled}
            style={[
              s.logButton,
              {
                backgroundColor: isSettled ? theme.surfaceDeep : theme.text,
                borderColor: isSettled ? theme.border : theme.text,
              },
            ]}
          >
            <Ionicons
              name={isOwe ? 'cash-outline' : 'wallet-outline'}
              size={16}
              color={isSettled ? theme.tertiary : theme.bg}
            />
            <Text style={[s.logButtonText, { color: isSettled ? theme.tertiary : theme.bg }]}>
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
    </>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  directionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  directionPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  statusPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // Balance card
  balanceCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  balanceMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  balanceMetaValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
  },

  // Info card
  infoCard: {
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoKey: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },

  // CTA button
  logButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Empty state
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
