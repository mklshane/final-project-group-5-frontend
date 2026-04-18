import { useEffect, useMemo, useState } from 'react';
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
import { useTheme } from '@/hooks/useTheme';
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

  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAmount(initialBudget ? toAmountString(initialBudget.amount_limit) : '');
    setPeriod(initialBudget?.period ?? defaultPeriod);
  }, [visible, initialBudget, defaultPeriod]);

  const amountValue = useMemo(() => Number(amount || '0'), [amount]);
  const isValid = Number.isFinite(amountValue) && amountValue > 0;

  const submitDisabledColor = isDark ? '#2C3122' : '#E4E6D6';

  const handleSave = async () => {
    if (!isValid || saving) return;

    setSaving(true);
    try {
      await onSave({
        amountLimit: amountValue,
        period,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isEdit = Boolean(initialBudget);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>AMOUNT</Text>
                <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                  <Text style={[s.currencyPrefix, { color: amount ? theme.text : theme.tertiary }]}>PHP</Text>
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

              {!isValid && amount.length > 0 ? (
                <Text style={[s.validationText, { color: theme.red }]}>Amount must be greater than zero.</Text>
              ) : null}

              <View style={s.actions}>
                <Pressable
                  onPress={() => void handleSave()}
                  disabled={!isValid || saving}
                  style={[
                    s.actionButton,
                    {
                      backgroundColor: !isValid || saving ? submitDisabledColor : (isDark ? theme.lime : '#3F7D36'),
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
  validationText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 8,
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
