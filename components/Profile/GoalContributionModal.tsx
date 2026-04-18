import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import { CURRENCIES } from '@/constants/currencies';
import type { WalletRecord } from '@/types/finance';

interface GoalContributionModalProps {
  visible: boolean;
  goalTitle: string;
  maxAmount: number;
  wallets: WalletRecord[];
  onClose: () => void;
  onSave: (input: {
    amount: number;
    date: string;
    walletId: string | null;
    note: string;
  }) => Promise<void>;
}

const toIsoDate = (date: Date) => {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const pickDefaultWallet = (wallets: WalletRecord[]) =>
  wallets.find((wallet) => wallet.is_default && !wallet.deleted_at)?.id ?? wallets[0]?.id ?? null;

const formatBalance = (value: number) => {
  const rounded = Math.round(value * 100) / 100;
  return Math.abs(rounded).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function GoalContributionModal({ visible, goalTitle, maxAmount, wallets, onClose, onSave }: GoalContributionModalProps) {
  const theme = useTheme();
  const { isDark } = theme;
  const { currencyCode } = useAppPreferences();

  const currencySymbol = useMemo(
    () => CURRENCIES.find((currency) => currency.code === currencyCode)?.symbol ?? '₱',
    [currencyCode]
  );

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setDate(new Date());
    setShowAndroidDatePicker(false);
    setSelectedWalletId(pickDefaultWallet(wallets));
    setNote('');
  }, [visible, wallets]);

  const amountValue = useMemo(() => Number(amount || '0'), [amount]);
  const isValid =
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    amountValue <= Math.max(0, maxAmount) &&
    selectedWalletId !== null;

  const validationMessage = useMemo(() => {
    if (amount === '') return null;
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return 'Enter an amount greater than 0.';
    }
    if (amountValue > maxAmount) {
      return 'Amount exceeds remaining goal balance.';
    }
    if (!selectedWalletId) {
      return 'Select a wallet to continue.';
    }
    return null;
  }, [amount, amountValue, maxAmount, selectedWalletId]);

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidDatePicker(false);
    }
    if (selected) {
      setDate(selected);
    }
  };

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await onSave({
        amount: amountValue,
        date: toIsoDate(date),
        walletId: selectedWalletId,
        note: note.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[s.overlay, { backgroundColor: theme.overlayModal }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View
            style={[
              s.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                maxHeight: Dimensions.get('window').height * 0.88,
              },
            ]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.scrollContent}
            >
              <View style={s.headerRow}>
                <View style={s.headerTextWrap}>
                  <Text style={[s.modalTitle, { color: theme.text }]}>Log contribution</Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>Record money allocated to {goalTitle}.</Text>
                </View>
                <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.fieldGroup}>
                <View style={s.amountLabelRow}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>CONTRIBUTION AMOUNT</Text>
                  <Text style={[s.maxText, { color: theme.tertiary }]}>Max: {currencySymbol}{maxAmount.toFixed(2)}</Text>
                </View>
                <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                  <Text style={[s.currencyPrefix, { color: amount ? theme.text : theme.tertiary }]}>{currencySymbol}</Text>
                  <TextInput
                    value={amount}
                    onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.tertiary}
                    style={[s.input, { color: theme.text }]}
                    selectionColor={theme.lime}
                  />
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.fieldLabel, { color: theme.secondary }]}>DATE</Text>
                <View style={[s.dateRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                  <Text style={[s.dateValue, { color: theme.text }]}>{toIsoDate(date)}</Text>
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="compact"
                      onChange={handleDateChange}
                      themeVariant={isDark ? 'dark' : 'light'}
                    />
                  ) : (
                    <Pressable onPress={() => setShowAndroidDatePicker(true)} style={s.dateButton}>
                      <Text style={[s.dateButtonText, { color: theme.lime }]}>Pick date</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {Platform.OS === 'android' && showAndroidDatePicker ? (
                <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />
              ) : null}

              <View style={s.fieldGroup}>
                <Text style={[s.fieldLabel, { color: theme.secondary }]}>USE WALLET</Text>
                {wallets.length === 0 ? (
                  <Text style={[s.emptyHint, { color: theme.tertiary }]}>No wallets available.</Text>
                ) : (
                  <View style={s.walletGrid}>
                    {wallets.map((wallet) => {
                      const active = selectedWalletId === wallet.id;
                      return (
                        <Pressable
                          key={wallet.id}
                          onPress={() => setSelectedWalletId(wallet.id)}
                          style={[
                            s.walletCard,
                            {
                              backgroundColor: active
                                ? isDark ? 'rgba(155,194,58,0.1)' : theme.surface
                                : theme.surfaceAlt,
                              borderColor: active ? theme.limeDark : theme.border,
                            },
                          ]}
                        >
                          <View style={s.walletCardInner}>
                            <View
                              style={[
                                s.walletIconWrap,
                                {
                                  backgroundColor: active ? 'rgba(155,194,58,0.18)' : `${theme.secondary}18`,
                                },
                              ]}
                            >
                              <Ionicons
                                name="wallet"
                                size={14}
                                color={active ? theme.limeDark : theme.secondary}
                              />
                            </View>
                            <View style={s.walletCardText}>
                              <Text
                                style={[s.walletCardName, { color: active ? theme.text : theme.secondary }]}
                                numberOfLines={1}
                              >
                                {wallet.name}
                              </Text>
                              <Text style={[s.walletCardBalance, { color: theme.secondary }]}> 
                                {currencySymbol}{formatBalance(wallet.current_balance ?? 0)}
                              </Text>
                            </View>
                            {active ? <Ionicons name="checkmark-circle" size={15} color={theme.limeDark} /> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.fieldLabel, { color: theme.secondary }]}>NOTE (OPTIONAL)</Text>
                <View style={[s.inputWrap, s.noteWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Add context for this contribution"
                    placeholderTextColor={theme.tertiary}
                    style={[s.noteInput, { color: theme.text }]}
                    multiline
                    textAlignVertical="top"
                    maxLength={180}
                    selectionColor={theme.lime}
                  />
                </View>
              </View>

              {validationMessage ? (
                <Text style={[s.validationText, { color: theme.red }]}>{validationMessage}</Text>
              ) : null}

              <Pressable
                onPress={() => {
                  void handleSave();
                }}
                disabled={!isValid || saving}
                style={[
                  s.saveBtn,
                  {
                    backgroundColor: !isValid || saving
                      ? isDark ? '#2C3122' : '#E4E6D6'
                      : isDark ? theme.lime : '#3F7D36',
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={isDark ? theme.bg : '#FFFFFF'} />
                ) : (
                  <Text style={[s.saveLabel, { color: isDark ? theme.bg : '#FFFFFF' }]}>Save Contribution</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  closeBtn: {
    padding: 4,
    marginTop: -2,
    marginRight: -2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  amountLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 7,
  },
  maxText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputWrap: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 0,
  },
  dateRow: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dateButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  walletGrid: {
    gap: 10,
  },
  walletCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  walletCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  walletIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCardText: {
    flex: 1,
  },
  walletCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  walletCardBalance: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 4,
  },
  noteWrap: {
    minHeight: 96,
    alignItems: 'flex-start',
  },
  noteInput: {
    flex: 1,
    width: '100%',
    paddingTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  validationText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
    marginBottom: 12,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  saveLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
