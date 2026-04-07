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
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';

type PaymentMode = 'owe' | 'owed';

interface PaymentLogModalProps {
  visible: boolean;
  mode: PaymentMode;
  maxAmount: number;
  onClose: () => void;
  onSave: (input: { amount: number; date: string }) => Promise<void>;
}

const toIsoDate = (date: Date) => {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function PaymentLogModal({ visible, mode, maxAmount, onClose, onSave }: PaymentLogModalProps) {
  const theme = useTheme();
  const { isDark } = theme;
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setDate(new Date());
    setShowAndroidDatePicker(false);
  }, [visible]);

  const amountValue = useMemo(() => Number(amount || '0'), [amount]);
  const isValid = Number.isFinite(amountValue) && amountValue > 0 && amountValue <= Math.max(0, maxAmount);

  const submitDisabledColor = isDark ? '#5A614B' : '#C8CEC0';
  const title = mode === 'owe' ? 'Log payment' : 'Log collection';
  const amountLabel = mode === 'owe' ? 'PAYMENT AMOUNT' : 'COLLECTION AMOUNT';

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
          <View>
            <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
              <Text style={[s.title, { color: theme.text }]}>{title}</Text>
              <Text style={[s.subtitle, { color: theme.secondary }]}>Record a partial payment to update the remaining balance.</Text>

              <Text style={[s.sectionLabel, { color: theme.secondary }]}>{amountLabel}</Text>
              <View style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}> 
                <TextInput
                  value={amount}
                  onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.inputPlaceholder}
                  style={[s.input, { color: theme.text }]}
                />
              </View>

              <Text style={[s.maxText, { color: theme.secondary }]}>Max available: {maxAmount.toFixed(2)}</Text>

              <Text style={[s.sectionLabel, { color: theme.secondary }]}>DATE</Text>
              <View style={[s.dateRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}> 
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
                    <Text style={[s.dateButtonText, { color: theme.limeDark }]}>Pick date</Text>
                  </Pressable>
                )}
              </View>

              {Platform.OS === 'android' && showAndroidDatePicker ? (
                <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />
              ) : null}

              {!isValid ? (
                <Text style={[s.validationText, { color: theme.red }]}>Enter an amount greater than 0 and not more than the remaining balance.</Text>
              ) : null}

              <View style={s.actions}>
                <Pressable
                  onPress={onClose}
                  style={[s.actionButton, s.half, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                >
                  <Text style={[s.actionText, { color: theme.text }]}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    void handleSave();
                  }}
                  disabled={!isValid || saving}
                  style={[
                    s.actionButton,
                    s.half,
                    {
                      backgroundColor: !isValid || saving ? submitDisabledColor : theme.lime,
                      borderColor: !isValid || saving ? submitDisabledColor : theme.lime,
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={theme.bg} />
                  ) : (
                    <Text style={[s.actionText, { color: theme.bg }]}>Save</Text>
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
    borderRadius: 18,
    padding: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  sectionLabel: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  input: {
    fontSize: 15,
    fontWeight: '600',
  },
  maxText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 7,
  },
  dateRow: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateButton: {
    height: 32,
    minWidth: 76,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  dateButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  half: {
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
