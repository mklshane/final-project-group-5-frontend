import { useEffect, useMemo, useRef, useState } from 'react';
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
import { handleRequestClose } from '@/utils/handleRequestClose';
import type { CategoryRecord, WalletRecord } from '@/types/finance';

type PaymentMode = 'owe' | 'owed';

interface PaymentLogModalProps {
  visible: boolean;
  mode: PaymentMode;
  maxAmount: number;
  personName: string;
  wallets: WalletRecord[];
  fixedCategory: CategoryRecord | null;
  onClose: () => void;
  onSave: (input: {
    amount: number;
    date: string;
    walletId: string | null;
    categoryId: string;
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
  wallets.find((w) => w.is_default && !w.deleted_at)?.id ?? wallets[0]?.id ?? null;

const toIoniconName = (icon: string | null | undefined): keyof typeof Ionicons.glyphMap | null => {
  if (!icon) return null;
  if (icon in Ionicons.glyphMap) return icon as keyof typeof Ionicons.glyphMap;
  return null;
};

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

const getSafeDate = (value: Date) => {
  if (Number.isFinite(value.getTime()) && value.getTime() > 0) return value;
  return new Date();
};

export function PaymentLogModal({
  visible,
  mode,
  maxAmount,
  personName: _personName,
  wallets,
  fixedCategory,
  onClose,
  onSave,
}: PaymentLogModalProps) {
  const theme = useTheme();
  const { isDark } = theme;
  const { currencyCode } = useAppPreferences();

  const currencySymbol = useMemo(
    () => CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? '₱',
    [currencyCode]
  );

  const [date, setDate] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const walletTriggerRef = useRef<View>(null);
  const [walletDropdownPos, setWalletDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [note, setNote] = useState('');
  const maxSelectableDate = new Date();
  const handleClose = () => {
    handleRequestClose({ mode: 'create', formik, onClose });
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
      .max(maxAmount, 'Amount exceeds the remaining balance'),
  }), [maxAmount]);

  const formik = useFormik({
    initialValues: { amount: '' },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      if (!fixedCategory || !selectedWalletId || isOverBalance) return;
      setSaving(true);
      try {
        const safeDate = getSafeDate(date);
        await onSave({
          amount: parseAmountInput(values.amount),
          date: toIsoDate(safeDate),
          walletId: selectedWalletId,
          categoryId: fixedCategory.id,
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
  const requiresFunds = mode === 'owe';
  const isOverBalance = requiresFunds && Boolean(selectedWalletId) && enteredAmount > 0 && enteredAmount > availableBalance;
  const canSubmit =
    !saving &&
    Boolean(selectedWalletId) &&
    Boolean(fixedCategory) &&
    formik.isValid &&
    !isOverBalance;

  const submitDisabledColor = isDark ? '#2C3122' : '#E4E6D6';
  const primaryBg = isDark ? theme.lime : '#3F7D36';
  const primaryText = isDark ? '#1A1E14' : '#FFFFFF';
  const title = mode === 'owe' ? 'Log payment' : 'Log collection';
  const subtitle =
    mode === 'owe'
      ? 'Record a payment to update the remaining balance.'
      : 'Record a collection to update the remaining balance.';
  const amountLabel = mode === 'owe' ? 'PAYMENT AMOUNT' : 'COLLECTION AMOUNT';
  const fixedCategoryMissingMessage =
    mode === 'owe'
      ? 'Debt Payment category is unavailable. Restore it to continue.'
      : 'Debt Collection category is unavailable. Restore it to continue.';

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidDatePicker(false);
    }
    if (selected) {
      setDate(selected);
    }
  };

  const displayDate = getSafeDate(date);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[s.overlay, { backgroundColor: theme.overlayModal }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border, maxHeight: Dimensions.get('window').height * 0.88 }]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.scrollContent}
            >
              {/* Header */}
              <View style={s.headerRow}>
                <View style={s.headerTextWrap}>
                  <Text style={[s.modalTitle, { color: theme.text }]}>{title}</Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>{subtitle}</Text>
                </View>
                <Pressable onPress={handleClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              {/* Amount */}
              <View style={s.fieldGroup}>
                <View style={s.amountLabelRow}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>{amountLabel}</Text>
                  <Text style={[s.maxText, { color: theme.tertiary }]}>
                    Max: {currencySymbol}{formatMoneyValue(maxAmount)}
                  </Text>
                </View>
                <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[s.currencyPrefix, { color: formik.values.amount ? theme.text : theme.tertiary }]}>
                    {currencySymbol}
                  </Text>
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

              {/* Date */}
              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>DATE</Text>
                <View style={[s.dateRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, justifyContent: 'space-between' }]}> 
                  <Ionicons name="calendar-outline" size={16} color={theme.secondary} style={s.dateIcon} />
                  {Platform.OS !== 'ios' && (
                    <Text style={[s.dateValue, { color: theme.text }]}>{toIsoDate(displayDate)}</Text>
                  )}
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={displayDate}
                      mode="date"
                      display="compact"
                      onChange={handleDateChange}
                      maximumDate={maxSelectableDate}
                      themeVariant={isDark ? 'dark' : 'light'}
                    />
                  ) : (
                    <Pressable onPress={() => setShowAndroidDatePicker(true)} style={s.dateButton}>
                      <Text style={[s.dateButtonText, { color: primaryBg }]}>Pick date</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {Platform.OS === 'android' && showAndroidDatePicker ? (
                <DateTimePicker
                  value={displayDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={maxSelectableDate}
                />
              ) : null}

              {/* Wallet Picker */}
              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>
                  {mode === 'owe' ? 'PAY FROM' : 'RECEIVE TO'}
                </Text>
                {wallets.length === 0 ? (
                  <Text style={[s.emptyHint, { color: theme.tertiary }]}>No wallets available.</Text>
                ) : (
                  <Pressable
                    ref={walletTriggerRef}
                    onPress={() => {
                      Keyboard.dismiss();
                      walletTriggerRef.current?.measureInWindow((x, y, width, height) => {
                        setWalletDropdownPos({ top: y + height + 4, left: x, width });
                        setWalletDropdownOpen(true);
                      });
                    }}
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
                )}
              </View>

              {/* Category */}
              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>CATEGORY</Text>
                <View
                  style={[
                    s.dropdownTrigger,
                    {
                      backgroundColor: isDark ? 'rgba(200,245,96,0.05)' : theme.surfaceAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={s.dropdownValueWrap}>
                    {fixedCategory ? (
                      <>
                        <View
                          style={[
                            s.categoryIconWrap,
                            { backgroundColor: `${fixedCategory.color ?? '#9DA28F'}20` },
                          ]}
                        >
                          <Ionicons
                            name={toIoniconName(fixedCategory.icon) ?? 'pricetag'}
                            size={14}
                            color={fixedCategory.color ?? theme.text}
                          />
                        </View>
                        <Text style={[s.dropdownValueText, { color: theme.text }]}>
                          {fixedCategory.name}
                        </Text>
                      </>
                    ) : (
                      <>
                        <View style={[s.categoryDot, { backgroundColor: theme.secondary }]} />
                        <Text style={[s.dropdownValueText, { color: theme.secondary }]}>
                          Debt category unavailable
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                {!fixedCategory ? (
                  <Text style={[s.validationText, { color: theme.red }]}>
                    {fixedCategoryMissingMessage}
                  </Text>
                ) : null}
              </View>

              {/* Note */}
              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>NOTE (OPTIONAL)</Text>
                <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Add a note..."
                    placeholderTextColor={theme.tertiary}
                    style={[s.input, { color: theme.text }]}
                    selectionColor={theme.lime}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
              </View>

              {/* Save button */}
              <View style={s.actions}>
                <Pressable
                  onPress={() => void formik.handleSubmit()}
                  disabled={!canSubmit}
                  style={[
                    s.actionButton,
                    { backgroundColor: !canSubmit ? submitDisabledColor : primaryBg },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={primaryText} />
                  ) : (
                    <Text style={[s.actionText, { color: !canSubmit ? theme.tertiary : primaryText }]}>
                      Save
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Wallet floating dropdown */}
      <Modal
        visible={walletDropdownOpen}
        transparent
        animationType="none"
        onRequestClose={() => setWalletDropdownOpen(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setWalletDropdownOpen(false)} />
        <ScrollView
          style={[
            s.walletFloatingDropdown,
            {
              top: walletDropdownPos.top,
              left: walletDropdownPos.left,
              width: walletDropdownPos.width,
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </Modal>
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
    borderRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    padding: 4,
    borderRadius: 12,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  amountLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 2,
    marginBottom: 8,
  },
  maxText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 1,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },

  // Date
  dateRow: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateButton: {
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(200,245,96,0.1)',
  },
  dateButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Wallet dropdown
  walletIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCardText: {
    flex: 1,
    minWidth: 0,
  },
  walletCardBalance: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
  },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingRight: 30,
  },
  dropdownValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownValueText: {
    fontSize: 15,
    fontWeight: '600',
  },
  autoBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 2,
    marginRight: 2,
  },
  categoryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletFloatingDropdown: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 280,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Validation
  validationText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 18,
  },

  // Actions
  actions: {
    marginTop: 10,
  },
  actionButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});