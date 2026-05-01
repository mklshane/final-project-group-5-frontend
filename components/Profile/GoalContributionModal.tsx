import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useFormik } from 'formik';
import * as Yup from 'yup';
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

const formatMoneyValue = (value: number) => {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseAmountInput = (value: string) => {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
};

const formatAmountInput = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  if (!cleaned) return '';

  const [rawInt, rawDec] = cleaned.split('.');
  const intPart = rawInt === '' ? '0' : rawInt;
  const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return rawDec !== undefined ? `${intWithCommas}.${rawDec}` : intWithCommas;
};

export function GoalContributionModal({ visible, goalTitle, maxAmount, wallets, onClose, onSave }: GoalContributionModalProps) {
  const theme = useTheme();
  const { isDark } = theme;
  const { currencyCode } = useAppPreferences();

  const currencySymbol = useMemo(
    () => CURRENCIES.find((currency) => currency.code === currencyCode)?.symbol ?? '₱',
    [currencyCode]
  );

  const [date, setDate] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [note, setNote] = useState('');
  const handleRequestClose = () => {
    if (formik.values.amount !== '' || note !== '') {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. If you leave now, your progress will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ],
      );
    } else {
      onClose();
    }
  };

  const validationSchema = useMemo(() => Yup.object({
    amount: Yup.number()
      .transform((_, originalValue) => {
        if (originalValue === '') return undefined;
        return parseAmountInput(String(originalValue));
      })
      .typeError('Enter a valid amount')
      .positive('Amount must be greater than 0')
      .required('Amount is required')
      .max(maxAmount, 'Amount exceeds remaining balance'),
  }), [maxAmount]);

  const formik = useFormik({
    initialValues: { amount: '' },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      if (selectedWalletId === null || isOverBalance) return;
      setSaving(true);
      try {
        await onSave({
          amount: parseAmountInput(values.amount),
          date: toIsoDate(date),
          walletId: selectedWalletId,
          note: note.trim(),
        });
        onClose();
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    if (!visible) return;
    setDate(new Date());
    setShowAndroidDatePicker(false);
    setSelectedWalletId(pickDefaultWallet(wallets));
    setWalletDropdownOpen(false);
    setNote('');
    formik.resetForm({ values: { amount: '' } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, wallets]);

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === selectedWalletId) ?? null,
    [wallets, selectedWalletId]
  );
  const availableBalance = Number.isFinite(Number(selectedWallet?.current_balance))
    ? Number(selectedWallet?.current_balance)
    : 0;
  const parsedEnteredAmount = parseAmountInput(formik.values.amount);
  const enteredAmount = Number.isFinite(parsedEnteredAmount) ? parsedEnteredAmount : 0;
  const isOverBalance = Boolean(selectedWalletId) && enteredAmount > 0 && enteredAmount > availableBalance;
  const canSubmit = !saving && Boolean(selectedWalletId) && formik.isValid && !isOverBalance;

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidDatePicker(false);
    }
    if (selected) {
      setDate(selected);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
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
                <Pressable onPress={handleRequestClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.fieldGroup}>
                <View style={s.amountLabelRow}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>CONTRIBUTION AMOUNT</Text>
                  <Text style={[s.maxText, { color: theme.tertiary }]}>Max: {currencySymbol}{formatMoneyValue(maxAmount)}</Text>
                </View>
                <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[s.currencyPrefix, { color: formik.values.amount ? theme.text : theme.tertiary }]}>{currencySymbol}</Text>
                  <TextInput
                    value={formik.values.amount}
                    onChangeText={(value) => {
                      void formik.setFieldValue('amount', formatAmountInput(value));
                    }}
                    onBlur={() => void formik.setFieldTouched('amount', true)}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="0.00"
                    placeholderTextColor={theme.tertiary}
                    style={[s.input, { color: theme.text }]}
                    selectionColor={theme.lime}
                  />
                </View>
                {isOverBalance ? (
                  <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '500', marginTop: 6 }}>
                    Amount exceeds available wallet balance ({currencySymbol}{formatBalance(availableBalance)}).
                  </Text>
                ) : formik.touched.amount && formik.errors.amount ? (
                  <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '500', marginTop: 6 }}>
                    {formik.errors.amount}
                  </Text>
                ) : null}
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.fieldLabel, { color: theme.secondary }]}>DATE</Text>
                <View style={[s.dateRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, justifyContent: Platform.OS === 'ios' ? 'flex-end' : 'space-between' }]}>
                  {Platform.OS !== 'ios' && (
                    <Text style={[s.dateValue, { color: theme.text }]}>{toIsoDate(date)}</Text>
                  )}
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
                      <Text style={[s.dateButtonText, { color: isDark ? theme.lime : '#3F7D36' }]}>Pick date</Text>
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
                  <>
                    <Pressable
                      onPress={() => { Keyboard.dismiss(); setWalletDropdownOpen(!walletDropdownOpen); }}
                      style={[
                        s.dropdownTrigger,
                        {
                          backgroundColor: theme.surfaceAlt,
                          borderColor: walletDropdownOpen ? theme.limeDark : theme.border,
                        },
                      ]}
                    >
                      <View style={s.dropdownValueWrap}>
                        <View style={[s.walletIconWrap, { backgroundColor: selectedWallet ? 'rgba(155,194,58,0.18)' : `${theme.secondary}18` }]}>
                          <Ionicons name="wallet" size={14} color={selectedWallet ? theme.limeDark : theme.secondary} />
                        </View>
                        {selectedWallet ? (
                          <View style={s.walletCardText}>
                            <Text style={[s.dropdownValueText, { color: theme.text }]} numberOfLines={1}>{selectedWallet.name}</Text>
                            <Text style={[s.walletCardBalance, { color: theme.secondary }]}>{currencySymbol}{formatBalance(selectedWallet.current_balance ?? 0)}</Text>
                          </View>
                        ) : (
                          <Text style={[s.dropdownValueText, { color: theme.secondary }]}>Select a wallet...</Text>
                        )}
                      </View>
                      <Ionicons name={walletDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.secondary} />
                    </Pressable>

                    {walletDropdownOpen && (
                      <View style={[s.dropdownMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {wallets.map((wallet, index) => {
                          const isLast = index === wallets.length - 1;
                          const isActive = selectedWalletId === wallet.id;
                          return (
                            <Pressable
                              key={wallet.id}
                              onPress={() => { setSelectedWalletId(wallet.id); setWalletDropdownOpen(false); }}
                              style={[
                                s.dropdownOption,
                                !isLast && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                                isActive && { backgroundColor: isDark ? 'rgba(155,194,58,0.06)' : 'rgba(155,194,58,0.10)' },
                              ]}
                            >
                              <View style={[s.walletIconWrap, { backgroundColor: isActive ? 'rgba(155,194,58,0.18)' : `${theme.secondary}18` }]}>
                                <Ionicons name="wallet" size={14} color={isActive ? theme.limeDark : theme.secondary} />
                              </View>
                              <View style={s.walletCardText}>
                                <Text style={[s.dropdownOptionText, { color: isActive ? theme.limeDark : theme.text }]} numberOfLines={1}>{wallet.name}</Text>
                                <Text style={[s.walletCardBalance, { color: theme.secondary }]}>{currencySymbol}{formatBalance(wallet.current_balance ?? 0)}</Text>
                              </View>
                              {isActive && <Ionicons name="checkmark" size={16} color={theme.limeDark} style={{ marginLeft: 'auto' }} />}
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </>
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

              <Pressable
                onPress={() => void formik.handleSubmit()}
                disabled={!canSubmit}
                style={[
                  s.saveBtn,
                  {
                    backgroundColor: !canSubmit
                      ? isDark ? '#2C3122' : '#E4E6D6'
                      : isDark ? theme.lime : '#3F7D36',
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={isDark ? theme.bg : '#FFFFFF'} />
                ) : (
                  <Text style={[s.saveLabel, { color: !canSubmit ? theme.tertiary : isDark ? theme.bg : '#FFFFFF' }]}>Save Contribution</Text>
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
  walletIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCardText: {
    flex: 1,
    minWidth: 0,
  },
  walletCardBalance: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '500',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '700',
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