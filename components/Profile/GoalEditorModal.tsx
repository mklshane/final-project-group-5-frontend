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
import type { GoalRecord } from '@/types/finance';

interface GoalEditorModalProps {
  visible: boolean;
  initialGoal?: GoalRecord | null;
  onClose: () => void;
  onSave: (input: {
    title: string;
    targetAmount: number;
    savedAmount: number;
    deadline?: string | null;
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

export function GoalEditorModal({ visible, initialGoal, onClose, onSave }: GoalEditorModalProps) {
  const theme = useTheme();
  const { isDark } = theme;

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(initialGoal?.title ?? '');
    setTargetAmount(initialGoal ? toAmountString(initialGoal.target_amount) : '');
    setSavedAmount(initialGoal ? toAmountString(initialGoal.saved_amount) : '');
    setDeadline(parseDate(initialGoal?.deadline));
    setShowAndroidDatePicker(false);
  }, [visible, initialGoal]);

  const targetValue = useMemo(() => Number(targetAmount || '0'), [targetAmount]);
  const savedValue = useMemo(() => Number(savedAmount || '0'), [savedAmount]);

  const isValid =
    title.trim().length > 0 &&
    Number.isFinite(targetValue) &&
    targetValue > 0 &&
    Number.isFinite(savedValue) &&
    savedValue >= 0 &&
    savedValue <= targetValue;

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidDatePicker(false);
    }
    if (selected) {
      setDeadline(selected);
    }
  };

  const handleSave = async () => {
    if (!isValid) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        targetAmount: targetValue,
        savedAmount: savedValue,
        deadline: toIsoDate(deadline),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const submitDisabledColor = isDark ? '#2C3122' : '#E4E6D6';

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
                <View>
                  <Text style={[s.title, { color: theme.text }]}>
                    {initialGoal ? 'Edit goal' : 'Add new goal'}
                  </Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>
                    Track your progress toward personal savings milestones.
                  </Text>
                </View>
                <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.formScroll}>
                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>GOAL NAME</Text>
                  <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="e.g. Emergency Fund"
                      placeholderTextColor={theme.tertiary}
                      style={[s.input, { color: theme.text }]}
                      selectionColor={theme.lime}
                    />
                  </View>
                </View>

                <View style={s.splitRow}>
                  <View style={[s.fieldGroup, { flex: 1 }]}>
                    <Text style={[s.sectionLabel, { color: theme.secondary }]}>TARGET AMOUNT</Text>
                    <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                      <Text style={[s.currencyPrefix, { color: targetAmount ? theme.text : theme.tertiary }]}>PHP</Text>
                      <TextInput
                        value={targetAmount}
                        onChangeText={(value) => setTargetAmount(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={theme.tertiary}
                        style={[s.input, { color: theme.text }]}
                        selectionColor={theme.lime}
                      />
                    </View>
                  </View>

                  <View style={[s.fieldGroup, { flex: 1 }]}>
                    <Text style={[s.sectionLabel, { color: theme.secondary }]}>ALREADY SAVED</Text>
                    <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                      <Text style={[s.currencyPrefix, { color: savedAmount ? theme.text : theme.tertiary }]}>PHP</Text>
                      <TextInput
                        value={savedAmount}
                        onChangeText={(value) => setSavedAmount(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={theme.tertiary}
                        style={[s.input, { color: theme.text }]}
                        selectionColor={theme.lime}
                      />
                    </View>
                  </View>
                </View>

                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>TARGET DATE</Text>
                  <View style={[s.dateRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <Text style={[s.dateValue, { color: theme.text }]}>{toIsoDate(deadline)}</Text>
                    {Platform.OS === 'ios' ? (
                      <DateTimePicker
                        value={deadline}
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
                  <DateTimePicker value={deadline} mode="date" display="default" onChange={handleDateChange} />
                ) : null}

                {!isValid && (title !== '' || targetAmount !== '' || savedAmount !== '') ? (
                  <Text style={[s.validationText, { color: theme.red }]}>
                    Make sure the goal has a name, a target amount, and that saved amount does not exceed the target.
                  </Text>
                ) : null}
              </View>

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
                      {initialGoal ? 'Save Changes' : 'Create Goal'}
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
    maxWidth: 250,
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
