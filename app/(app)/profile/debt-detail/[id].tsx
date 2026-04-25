import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DebtEditorModal } from '@/components/Profile/DebtEditorModal';
import { PaymentLogModal } from '@/components/Profile/PaymentLogModal';
import { useTheme } from '@/hooks/useTheme';
import { useFinanceData } from '@/context/FinanceDataContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';
import {
  DEBT_COLLECTION_CATEGORY_NAME,
  DEBT_PAYMENT_CATEGORY_NAME,
} from '@/constants/defaultCategories';

const toDateLabel = (value: string) => {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const toTimeLabel = (value: string | null | undefined) => {
  if (!value) return '--:--';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return '--:--';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return '--:--';
  return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const toDaysLabel = (value: string | null | undefined) => {
  if (!value) return 'No due date';
  const parsed = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(parsed.getTime())) return 'No due date';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.ceil((parsed.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} to go`;
  if (diffDays === 0) return 'Due today';
  const overdueDays = Math.abs(diffDays);
  return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
};

export default function DebtDetailScreen() {
  const theme = useTheme();
  const { state, updateDebt, deleteDebt, addTransaction } = useFinanceData();
  const finance = useFinanceSelectors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);

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
  const timelineLabel = toDaysLabel(debt.due_date);
  const subtitleLabel = debt.due_date ? `${dateLabel}: ${toDateLabel(debt.due_date)}` : 'No due date';

  const accentColor = isOwe ? theme.orange : (theme.isDark ? theme.green : '#3F7D36');
  const accentBg = isOwe ? 'rgba(255,173,92,0.12)' : (theme.isDark ? 'rgba(61,217,123,0.12)' : 'rgba(63,125,54,0.10)');
  const logButtonColor = theme.isDark ? theme.lime : '#3F7D36';
  const logButtonLabelColor = theme.isDark ? theme.bg : '#FFFFFF';
  const directionIcon: React.ComponentProps<typeof Ionicons>['name'] = isOwe
    ? 'arrow-up-circle'
    : 'arrow-down-circle';

  const activeWallets = state.wallets.filter((wallet) => !wallet.deleted_at);

  const fixedCategoryName = isOwe ? DEBT_PAYMENT_CATEGORY_NAME : DEBT_COLLECTION_CATEGORY_NAME;
  const normalizedCategoryName = fixedCategoryName.trim().toLowerCase();
  const fixedPaymentCategory =
    state.categories.find(
      (category) =>
        !category.deleted_at && category.name.trim().toLowerCase() === normalizedCategoryName
    ) ?? null;

  const debtMarker = `[#debt:${debtId}]`;
  const paymentTransactions = state.transactions
    .filter((tx) => !tx.deleted_at && tx.note?.includes(debtMarker))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const savePayment = async (input: {
    amount: number;
    date: string;
    walletId: string | null;
    categoryId: string;
    note: string;
  }) => {
    const nextPaid = Math.min(totalAmount, paidAmount + input.amount);
    const linkedNote = input.note
      ? `${input.note} [#debt:${debt.id}]`
      : `[#debt:${debt.id}]`;
    const txTitle = isOwe
      ? `Debt Payment - ${personName}`
      : `Payment from ${personName}`;

    await Promise.all([
      updateDebt({
        id: debt.id,
        amountPaid: nextPaid,
        dueDate: debt.due_date,
        notes: debt.notes ?? undefined,
      }),
      addTransaction({
        title: txTitle,
        amount: input.amount,
        type: isOwe ? 'expense' : 'income',
        walletId: input.walletId,
        categoryId: input.categoryId,
        date: input.date,
        note: linkedNote,
      }),
    ]);
  };

  const saveDebtEdits = async (input: {
    counterpartyKind?: 'person' | 'entity' | 'organization';
    counterpartyName: string;
    totalAmount: number;
    amountPaid: number;
    dueDate: string;
    notes?: string;
  }) => {
    await updateDebt({
      id: debt.id,
      counterpartyKind: input.counterpartyKind,
      counterpartyName: input.counterpartyName,
      totalAmount: input.totalAmount,
      amountPaid: input.amountPaid,
      dueDate: input.dueDate,
      notes: input.notes,
    });
  };

  const confirmDeleteDebt = async () => {
    await deleteDebt(debt.id);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: personName }} />
      <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          <View style={[s.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <View style={s.heroHeaderRow}>
              <View style={s.heroTextBlock}>
                <Text style={[s.heroTitle, { color: theme.text }]} numberOfLines={1}>{personName}</Text>
                <Text style={[s.heroSubtitle, { color: theme.secondary }]} numberOfLines={1}>{subtitleLabel}</Text>
              </View>

              <View style={s.heroHeaderRight}>
                <View style={[s.changePill, { backgroundColor: accentBg }]}> 
                  <Ionicons
                    name={isSettled ? 'checkmark-circle' : 'arrow-up-circle'}
                    size={13}
                    color={accentColor}
                  />
                  <Text style={[s.changePillText, { color: accentColor }]}>{progress}%</Text>
                </View>
                <Text style={[s.changeCaption, { color: theme.secondary }]}>
                  {isOwe ? 'Payment progress' : 'Collection progress'}
                </Text>
              </View>
            </View>

            <View style={s.metaRow}>
              <View style={[s.statusPill, { backgroundColor: isSettled ? 'rgba(61,217,123,0.12)' : theme.surfaceDeep }]}> 
                <Text style={[s.statusPillText, { color: isSettled ? theme.green : theme.secondary }]}> 
                  {statusLabel}
                </Text>
              </View>
            </View>

            <View style={[s.progressOverviewCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
              <View style={s.progressAmountRow}>
                <Text style={[s.progressPrimaryAmount, { color: remainingAmount > 0 ? theme.text : theme.green }]}> 
                  {finance.formatCurrency(paidAmount)}
                </Text>
                <Text style={[s.progressSecondaryAmount, { color: theme.secondary }]}> 
                  {finance.formatCurrency(totalAmount)}
                </Text>
              </View>

              <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}> 
                <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
              </View>

              <View style={s.progressFooterRow}>
                <Text style={[s.progressFooterText, { color: theme.secondary }]}>{timelineLabel}</Text>
                <Text style={[s.progressFooterPercent, { color: theme.text }]}>{progress}%</Text>
              </View>
            </View>
          </View>

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

          {paymentTransactions.length > 0 ? (
            <View style={[s.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
              <Text style={[s.historySectionLabel, { color: theme.secondary }]}>TRANSACTIONS</Text>
              {paymentTransactions.map((tx, index) => {
                const wallet = state.wallets.find((w) => w.id === tx.wallet_id);
                const isLast = index === paymentTransactions.length - 1;
                const transactionTime = toTimeLabel(tx.created_at ?? tx.updated_at ?? null);
                return (
                  <View
                    key={tx.id}
                    style={[
                      s.historyRow,
                      {
                        backgroundColor: theme.surfaceAlt,
                        borderColor: theme.border,
                      },
                      !isLast && s.historyRowGap,
                    ]}
                  >
                    <View style={s.historyLeft}>
                      <View style={s.historyTopRow}>
                        <Text style={[s.historyDate, { color: theme.text }]}>{toDateLabel(tx.date)}</Text>
                        {wallet?.name ? (
                          <View style={[s.walletPill, { backgroundColor: theme.surfaceDeep, borderColor: theme.border }]}> 
                            <Text style={[s.walletPillText, { color: theme.secondary }]} numberOfLines={1}>{wallet.name}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[s.historyMeta, { color: theme.tertiary }]}>{transactionTime}</Text>
                    </View>
                    <Text style={[s.historyAmount, { color: accentColor }]}> 
                      {finance.formatCurrency(tx.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>

        <View style={[s.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <Pressable
            onPress={() => setEditorVisible(true)}
            style={[s.footerActionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={18} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert(
              'Delete debt entry?',
              `Delete debt entry for "${personName}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => void confirmDeleteDebt() },
              ],
            )}
            style={[s.footerActionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={theme.red} />
          </Pressable>

          <Pressable
            onPress={() => setPaymentVisible(true)}
            disabled={isSettled}
            style={[
              s.logButton,
              {
                backgroundColor: logButtonColor,
                borderColor: logButtonColor,
                opacity: isSettled ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons
              name={isOwe ? 'cash-outline' : 'wallet-outline'}
              size={16}
              color={logButtonLabelColor}
            />
            <Text style={[s.logButtonText, { color: logButtonLabelColor }]}> 
              {isOwe ? 'Log Payment' : 'Log Collection'}
            </Text>
          </Pressable>
        </View>

        <PaymentLogModal
          visible={paymentVisible}
          mode={debt.type}
          maxAmount={remainingAmount}
          personName={personName}
          wallets={activeWallets}
          fixedCategory={fixedPaymentCategory}
          onClose={() => setPaymentVisible(false)}
          onSave={savePayment}
        />

        <DebtEditorModal
          visible={editorVisible}
          mode={debt.type}
          initialDebt={debt}
          onClose={() => setEditorVisible(false)}
          onSave={saveDebtEdits}
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
    paddingBottom: 16,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  heroHeaderRight: {
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changePillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  changeCaption: {
    fontSize: 11,
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 10,
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
  progressOverviewCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  progressAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressPrimaryAmount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  progressSecondaryAmount: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressFooterText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  progressFooterPercent: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 12,
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
  historyCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'visible',
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  historySectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  historyRowGap: {
    marginBottom: 8,
  },
  historyLeft: {
    flex: 1,
    gap: 4,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  walletPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 120,
  },
  walletPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButton: {
    flex: 1,
    height: 48,
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
