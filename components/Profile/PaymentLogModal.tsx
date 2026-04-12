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
import { Ionicons } from '@expo/vector-icons';
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

  const submitDisabledColor = isDark ? '#2C3122' : '#E4E6D6';
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
              <View style={s.headerRow}>
                <View style={s.headerTextWrap}>
                  <Text style={[s.title, { color: theme.text }]}>{title}</Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>
                    Record a partial payment to update the remaining balance.
                  </Text>
                </View>
                <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.fieldGroup}>
                <View style={s.amountLabelRow}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>{amountLabel}</Text>
                  <Text style={[s.maxText, { color: theme.tertiary }]}>Max: ₱{maxAmount.toFixed(2)}</Text>
                </View>
                <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                  <Text style={[s.currencyPrefix, { color: amount ? theme.text : theme.tertiary }]}>₱</Text>
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
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>DATE</Text>
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

              {!isValid && amount !== '' ? (
                <Text style={[s.validationText, { color: theme.red }]}>
                  Enter an amount greater than 0 and not more than the remaining balance.
                </Text>
              ) : null}

              <View style={s.actions}>
                <Pressable
                  onPress={() => void handleSave()}
                  disabled={!isValid || saving}
                  style={[
                    s.actionButton,
                    {
                      backgroundColor: !isValid || saving ? submitDisabledColor : theme.lime,
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#1A1E14" />
                  ) : (
                    <Text style={[s.actionText, { color: !isValid || saving ? theme.tertiary : '#1A1E14' }]}>
                      Save
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
    flex: 1,           // Forces text to wrap instead of pushing the button
    paddingRight: 16,  // Gives breathing room between text and the X button
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
    paddingRight: 10,
  },
  closeBtn: {
    backgroundColor: 'transparent',
    padding: 4,
    borderRadius: 12,
  },
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
  validationText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
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