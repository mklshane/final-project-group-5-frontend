import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import type { DebtCounterpartyKind, DebtRecord } from '@/types/finance';

type DebtEditorMode = 'owe' | 'owed';

const COUNTERPARTY_KINDS: DebtCounterpartyKind[] = ['person', 'entity', 'organization'];

interface DebtEditorModalProps {
  visible: boolean;
  mode: DebtEditorMode;
  initialDebt?: DebtRecord | null;
  onClose: () => void;
  onSave: (input: {
    counterpartyKind?: DebtCounterpartyKind;
    counterpartyName: string;
    totalAmount: number;
    amountPaid: number;
    dueDate: string;
    notes?: string;
  }) => Promise<void>;
}

const toIsoDate = (date: Date) => {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseDate = (value: string | null | undefined) => {
  if (!value) return new Date();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (Number.isFinite(parsed.getTime())) return parsed;
  }

  const fallback = new Date(value);
  if (Number.isFinite(fallback.getTime())) return fallback;
  return new Date();
};

const toAmountString = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '';
  return value % 1 === 0 ? String(value) : String(Math.round(value * 100) / 100);
};

const DebtSchema = Yup.object({
  counterpartyName: Yup.string().trim().required('Name is required'),
  totalAmount: Yup.number()
    .typeError('Enter a valid amount')
    .positive('Total must be greater than 0')
    .required('Total amount is required'),
  amountPaid: Yup.number()
    .typeError('Enter a valid amount')
    .min(0, 'Cannot be negative')
    .test('paid-lte-total', 'Cannot exceed total amount', function (value) {
      const { totalAmount } = this.parent;
      if (value === undefined || value === null) return true;
      if (!totalAmount) return true;
      return value <= totalAmount;
    }),
  notes: Yup.string(),
});

export function DebtEditorModal({ visible, mode, initialDebt, onClose, onSave }: DebtEditorModalProps) {
  const theme = useTheme();
  const { isDark } = theme;
  const { currencyCode } = useAppPreferences();

  const [counterpartyKind, setCounterpartyKind] = useState<DebtCounterpartyKind>('person');
  const [dueDate, setDueDate] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const currencySymbol = CURRENCIES.find((currency) => currency.code === currencyCode)?.symbol ?? currencyCode;

  const formik = useFormik({
    initialValues: { counterpartyName: '', totalAmount: '', amountPaid: '', notes: '' },
    validationSchema: DebtSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await onSave({
          counterpartyKind: mode === 'owe' ? counterpartyKind : undefined,
          counterpartyName: values.counterpartyName.trim(),
          totalAmount: Number(values.totalAmount),
          amountPaid: Number(values.amountPaid),
          dueDate: toIsoDate(dueDate),
          notes: values.notes.trim() || undefined,
        });
        onClose();
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    if (!visible) return;

    const debtTotal = Number.isFinite(initialDebt?.total_amount)
      ? Number(initialDebt?.total_amount)
      : Number(initialDebt?.amount ?? 0);
    const debtPaid = Number.isFinite(initialDebt?.amount_paid) ? Number(initialDebt?.amount_paid) : 0;

    setCounterpartyKind(initialDebt?.counterparty_kind ?? 'person');
    setDueDate(parseDate(initialDebt?.due_date));
    setShowAndroidDatePicker(false);
    formik.resetForm({
      values: {
        counterpartyName: initialDebt?.counterparty_name ?? initialDebt?.person_name ?? '',
        totalAmount: initialDebt ? toAmountString(debtTotal) : '',
        amountPaid: initialDebt ? toAmountString(debtPaid) : '',
        notes: initialDebt?.notes ?? initialDebt?.description ?? '',
      },
    });
  }, [visible, initialDebt]);

  const submitDisabledColor = isDark ? '#2C3122' : '#E4E6D6';
  const dueDateLabel = mode === 'owe' ? 'DUE DATE' : 'EXPECTED BY';
  const paidLabel = mode === 'owe' ? 'ALREADY PAID' : 'ALREADY COLLECTED';
  const counterpartyLabel = mode === 'owe' ? 'WHO IS THIS OWED TO?' : 'WHO OWES TO YOU?';

  const handleRequestClose = () => {
    if (!initialDebt && formik.dirty) {
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

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidDatePicker(false);
    }
    if (selected) {
      setDueDate(selected);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
      <KeyboardAvoidingView
        style={[s.overlay, { backgroundColor: theme.overlayModal }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View>
            <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={s.headerRow}>
                <View>
                  <Text style={[s.title, { color: theme.text }]}>
                    {initialDebt ? 'Edit entry' : mode === 'owe' ? 'Add debt' : 'Add money owed'}
                  </Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>
                    Track remaining balances and due dates.
                  </Text>
                </View>
                <Pressable onPress={handleRequestClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.formScroll}>
                {mode === 'owe' ? (
                  <View style={s.fieldGroup}>
                    <Text style={[s.sectionLabel, { color: theme.secondary }]}>TYPE</Text>
                    <View style={s.kindRow}>
                      {COUNTERPARTY_KINDS.map((kind) => {
                        const active = counterpartyKind === kind;
                        return (
                          <Pressable
                            key={kind}
                            onPress={() => setCounterpartyKind(kind)}
                            style={[
                              s.kindChip,
                              {
                                backgroundColor: active ? theme.lime : theme.surfaceAlt,
                                borderColor: active ? theme.lime : theme.border,
                              },
                            ]}
                          >
                            <Text style={[s.kindLabel, { color: active ? '#1A1E14' : theme.secondary }]}>
                              {kind.toUpperCase()}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>{counterpartyLabel}</Text>
                  <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <TextInput
                      value={formik.values.counterpartyName}
                      onChangeText={formik.handleChange('counterpartyName')}
                      onBlur={formik.handleBlur('counterpartyName')}
                      placeholder={mode === 'owe' ? 'e.g. John, BDO, Landlord' : 'e.g. Alex, Client Co.'}
                      placeholderTextColor={theme.tertiary}
                      style={[s.input, { color: theme.text }]}
                      selectionColor={theme.lime}
                    />
                  </View>
                  {formik.touched.counterpartyName && formik.errors.counterpartyName ? (
                    <Text style={s.fieldError}>{formik.errors.counterpartyName}</Text>
                  ) : null}
                </View>

                <View style={s.splitRow}>
                  <View style={[s.fieldGroup, { flex: 1 }]}>
                    <Text style={[s.sectionLabel, { color: theme.secondary }]}>{mode === 'owe' ? 'TOTAL DEBT' : 'TOTAL OWED'}</Text>
                    <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                      <Text style={[s.currencyPrefix, { color: formik.values.totalAmount ? theme.text : theme.tertiary }]}>{currencySymbol}</Text>
                      <TextInput
                        value={formik.values.totalAmount}
                        onChangeText={(value) =>
                          formik.setFieldValue(
                            'totalAmount',
                            value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'),
                          )
                        }
                        onBlur={() => formik.setFieldTouched('totalAmount', true)}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        placeholder="0.00"
                        placeholderTextColor={theme.tertiary}
                        style={[s.input, { color: theme.text }]}
                        selectionColor={theme.lime}
                      />
                    </View>
                    {formik.touched.totalAmount && formik.errors.totalAmount ? (
                      <Text style={s.fieldError}>{formik.errors.totalAmount}</Text>
                    ) : null}
                  </View>

                  <View style={[s.fieldGroup, { flex: 1 }]}>
                    <Text style={[s.sectionLabel, { color: theme.secondary }]}>{paidLabel} <Text style={s.optionalLabel}>(Optional)</Text></Text>
                    <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                      <Text style={[s.currencyPrefix, { color: formik.values.amountPaid ? theme.text : theme.tertiary }]}>{currencySymbol}</Text>
                      <TextInput
                        value={formik.values.amountPaid}
                        onChangeText={(value) =>
                          formik.setFieldValue(
                            'amountPaid',
                            value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'),
                          )
                        }
                        onBlur={() => formik.setFieldTouched('amountPaid', true)}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        placeholder="0.00"
                        placeholderTextColor={theme.tertiary}
                        style={[s.input, { color: theme.text }]}
                        selectionColor={theme.lime}
                      />
                    </View>
                    {formik.touched.amountPaid && formik.errors.amountPaid ? (
                      <Text style={s.fieldError}>{formik.errors.amountPaid}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>{dueDateLabel}</Text>
                  <View style={[s.dateRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <Text style={[s.dateValue, { color: theme.text }]}>{toIsoDate(dueDate)}</Text>
                    {Platform.OS === 'ios' ? (
                      <DateTimePicker
                        value={dueDate}
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
                  <DateTimePicker value={dueDate} mode="date" display="default" onChange={handleDateChange} />
                ) : null}

                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>NOTES (OPTIONAL)</Text>
                  <View style={[s.notesWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <TextInput
                      value={formik.values.notes}
                      onChangeText={formik.handleChange('notes')}
                      onBlur={formik.handleBlur('notes')}
                      placeholder="Add context..."
                      placeholderTextColor={theme.tertiary}
                      style={[s.notesInput, { color: theme.text }]}
                      selectionColor={theme.lime}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>

              <View style={s.actions}>
                <Pressable
                  onPress={() => void formik.handleSubmit()}
                  disabled={saving}
                  style={[
                    s.actionButton,
                    {
                      backgroundColor: saving ? submitDisabledColor : theme.lime,
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#1A1E14" />
                  ) : (
                    <Text style={[s.actionText, { color: saving ? theme.tertiary : '#1A1E14' }]}>
                      {initialDebt ? 'Save Changes' : 'Create Entry'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
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
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
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
  formScroll: {
    marginBottom: 10,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 2,
  },
  kindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kindChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  kindLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
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
  dateRow: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  notesWrap: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 80,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  notesInput: {
    fontSize: 15,
    fontWeight: '500',
    minHeight: 52,
  },
  optionalLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0,
    opacity: 0.55,
  },
  fieldError: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
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
