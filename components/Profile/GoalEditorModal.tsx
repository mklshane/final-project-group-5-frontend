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

const GoalSchema = Yup.object({
  title: Yup.string().trim().required('Goal name is required'),
  targetAmount: Yup.number()
    .typeError('Enter a valid amount')
    .positive('Target must be greater than 0')
    .required('Target amount is required'),
  savedAmount: Yup.number()
    .typeError('Enter a valid amount')
    .min(0, 'Cannot be negative')
    .test('saved-lte-target', 'Cannot exceed target amount', function (value) {
      const { targetAmount } = this.parent;
      if (value === undefined || value === null) return true;
      if (!targetAmount) return true;
      return value <= targetAmount;
    }),
});

export function GoalEditorModal({ visible, initialGoal, onClose, onSave }: GoalEditorModalProps) {
  const theme = useTheme();
  const { isDark } = theme;

  const [deadline, setDeadline] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const formik = useFormik({
    initialValues: { title: '', targetAmount: '', savedAmount: '' },
    validationSchema: GoalSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await onSave({
          title: values.title.trim(),
          targetAmount: Number(values.targetAmount),
          savedAmount: Number(values.savedAmount),
          deadline: toIsoDate(deadline),
        });
        onClose();
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    if (!visible) return;
    setDeadline(parseDate(initialGoal?.deadline));
    setShowAndroidDatePicker(false);
    formik.resetForm({
      values: {
        title: initialGoal?.title ?? '',
        targetAmount: initialGoal ? toAmountString(initialGoal.target_amount) : '',
        savedAmount: initialGoal ? toAmountString(initialGoal.saved_amount) : '',
      },
    });
  }, [visible, initialGoal]);

  const handleRequestClose = () => {
    if (!initialGoal && formik.dirty) {
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
      setDeadline(selected);
    }
  };

  const submitDisabledColor = isDark ? '#2C3122' : '#E4E6D6';

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
                    {initialGoal ? 'Edit goal' : 'Add new goal'}
                  </Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>
                    Track your progress toward personal savings milestones.
                  </Text>
                </View>
                <Pressable onPress={handleRequestClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.formScroll}>
                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>GOAL NAME</Text>
                  <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <TextInput
                      value={formik.values.title}
                      onChangeText={formik.handleChange('title')}
                      onBlur={formik.handleBlur('title')}
                      placeholder="e.g. Emergency Fund"
                      placeholderTextColor={theme.tertiary}
                      style={[s.input, { color: theme.text }]}
                      selectionColor={theme.lime}
                    />
                  </View>
                  {formik.touched.title && formik.errors.title ? (
                    <Text style={s.fieldError}>{formik.errors.title}</Text>
                  ) : null}
                </View>

                <View style={s.splitRow}>
                  <View style={[s.fieldGroup, { flex: 1 }]}>
                    <Text style={[s.sectionLabel, { color: theme.secondary }]}>TARGET AMOUNT</Text>
                    <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                      <Text style={[s.currencyPrefix, { color: formik.values.targetAmount ? theme.text : theme.tertiary }]}>PHP</Text>
                      <TextInput
                        value={formik.values.targetAmount}
                        onChangeText={(value) =>
                          formik.setFieldValue(
                            'targetAmount',
                            value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'),
                          )
                        }
                        onBlur={() => formik.setFieldTouched('targetAmount', true)}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={theme.tertiary}
                        style={[s.input, { color: theme.text }]}
                        selectionColor={theme.lime}
                      />
                    </View>
                    {formik.touched.targetAmount && formik.errors.targetAmount ? (
                      <Text style={s.fieldError}>{formik.errors.targetAmount}</Text>
                    ) : null}
                  </View>

                  <View style={[s.fieldGroup, { flex: 1 }]}>
                    <Text style={[s.sectionLabel, { color: theme.secondary }]}>ALREADY SAVED <Text style={s.optionalLabel}>(Optional)</Text></Text>
                    <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                      <Text style={[s.currencyPrefix, { color: formik.values.savedAmount ? theme.text : theme.tertiary }]}>PHP</Text>
                      <TextInput
                        value={formik.values.savedAmount}
                        onChangeText={(value) =>
                          formik.setFieldValue(
                            'savedAmount',
                            value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'),
                          )
                        }
                        onBlur={() => formik.setFieldTouched('savedAmount', true)}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={theme.tertiary}
                        style={[s.input, { color: theme.text }]}
                        selectionColor={theme.lime}
                      />
                    </View>
                    {formik.touched.savedAmount && formik.errors.savedAmount ? (
                      <Text style={s.fieldError}>{formik.errors.savedAmount}</Text>
                    ) : null}
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
