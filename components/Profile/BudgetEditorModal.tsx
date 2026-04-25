import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTheme } from '@/hooks/useTheme';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
import type { BudgetPeriod, BudgetRecord, CategoryRecord } from '@/types/finance';

interface BudgetEditorModalProps {
  visible: boolean;
  category: CategoryRecord | null;
  initialBudget?: BudgetRecord | null;
  defaultPeriod: BudgetPeriod;
  onClose: () => void;
  onSave: (input: { amountLimit: number; period: BudgetPeriod }) => Promise<void>;
}

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Annual' },
];

const toAmountString = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '';
  return value % 1 === 0 ? String(value) : String(Math.round(value * 100) / 100);
};

const validationSchema = Yup.object({
  amount: Yup.number()
    .typeError('Enter a valid amount')
    .positive('Amount must be greater than 0')
    .required('Amount is required'),
});

export function BudgetEditorModal({
  visible,
  category,
  initialBudget,
  defaultPeriod,
  onClose,
  onSave,
}: BudgetEditorModalProps) {
  const theme = useTheme();
  const { isDark } = theme;

  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [saving, setSaving] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);

  const handleRequestClose = () => {
    if (!initialBudget && formik.dirty) {
      setDiscardVisible(true);
    } else {
      onClose();
    }
  };

  const formik = useFormik({
    initialValues: { amount: '' },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await onSave({
          amountLimit: Number(values.amount),
          period,
        });
        onClose();
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    if (!visible) return;
    formik.resetForm({
      values: { amount: initialBudget ? toAmountString(initialBudget.amount_limit) : '' },
    });
    setPeriod(initialBudget?.period ?? defaultPeriod);
  }, [visible, initialBudget, defaultPeriod]);

  const submitDisabledColor = isDark ? '#2C3122' : '#E4E6D6';
  const isEdit = Boolean(initialBudget);

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
                <View style={s.headerTextWrap}>
                  <Text style={[s.title, { color: theme.text }]}>
                    {isEdit ? 'Edit Category Budget' : 'Set Category Budget'}
                  </Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>
                    {category?.name ?? 'Category'}
                  </Text>
                </View>
                <Pressable onPress={handleRequestClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>AMOUNT</Text>
                <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[s.currencyPrefix, { color: formik.values.amount ? theme.text : theme.tertiary }]}>PHP</Text>
                  <TextInput
                    value={formik.values.amount}
                    onChangeText={(value) =>
                      formik.setFieldValue(
                        'amount',
                        value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                      )
                    }
                    onBlur={formik.handleBlur('amount')}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.tertiary}
                    style={[s.input, { color: theme.text }]}
                    selectionColor={theme.lime}
                  />
                </View>
                {formik.touched.amount && formik.errors.amount ? (
                  <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '500', marginTop: 6 }}>
                    {formik.errors.amount}
                  </Text>
                ) : null}
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>INTERVAL</Text>
                <View style={s.periodWrap}>
                  {PERIOD_OPTIONS.map((option) => {
                    const active = period === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setPeriod(option.value)}
                        style={[
                          s.periodChip,
                          {
                            backgroundColor: active ? (isDark ? theme.lime : '#3F7D36') : theme.surfaceAlt,
                            borderColor: active ? (isDark ? theme.lime : '#3F7D36') : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.periodChipText,
                            { color: active ? (isDark ? theme.bg : '#FFFFFF') : theme.secondary },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={s.actions}>
                <Pressable
                  onPress={() => void formik.handleSubmit()}
                  disabled={saving}
                  style={[
                    s.actionButton,
                    {
                      backgroundColor: saving ? submitDisabledColor : (isDark ? theme.lime : '#3F7D36'),
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={isDark ? '#1A1E14' : '#FFFFFF'} />
                  ) : (
                    <Text style={[s.actionText, { color: isDark ? '#1A1E14' : '#FFFFFF' }]}>
                      {isEdit ? 'Save Budget' : 'Create Budget'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <ConfirmDeleteModal
        visible={discardVisible}
        title="Discard changes?"
        message="You have unsaved changes. If you leave now, your progress will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onCancel={() => setDiscardVisible(false)}
        onConfirm={() => { setDiscardVisible(false); onClose(); }}
      />
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
  headerTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    padding: 4,
    borderRadius: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 2,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    height: '100%',
  },
  periodWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    borderWidth: 1,
    borderRadius: 12,
    height: 38,
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  actions: {
    marginTop: 10,
  },
  actionButton: {
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
