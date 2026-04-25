import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ConfirmDeleteModal } from '@/components/Base/ConfirmDeleteModal';
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
import { WALLET_TYPE_LABELS } from '@/constants/defaultWallets';
import { CURRENCIES } from '@/constants/currencies';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import type { WalletRecord, WalletType } from '@/types/finance';

const WALLET_TYPES: WalletType[] = ['general', 'bank', 'ewallet', 'cash'];

interface WalletEditorModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initialWallet?: WalletRecord | null;
  onClose: () => void;
  onSave: (input: {
    name: string;
    type: WalletType;
    institutionName: string | null;
    openingBalance: number;
    currentBalance: number;
    isDefault: boolean;
  }) => Promise<void>;
}

const toAmountString = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '';
  return value % 1 === 0 ? String(value) : String(Math.round(value * 100) / 100);
};

const validationSchema = Yup.object({
  name: Yup.string().trim().required('Wallet name is required'),
  currentBalance: Yup.string().test(
    'is-valid-balance',
    'Enter a valid balance (0 or more)',
    (value) => {
      const num = Number(value || '0');
      return Number.isFinite(num) && num >= 0;
    }
  ),
});

export function WalletEditorModal({
  visible,
  mode,
  initialWallet,
  onClose,
  onSave,
}: WalletEditorModalProps) {
  const theme = useTheme();
  const { isDark } = theme;
  const { currencyCode } = useAppPreferences();

  const [type, setType] = useState<WalletType>('general');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);

  const handleRequestClose = () => {
    if (mode === 'create' && formik.dirty) {
      setDiscardVisible(true);
    } else {
      onClose();
    }
  };

  const currencySymbol = useMemo(
    () => CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? '₱',
    [currencyCode]
  );

  const formik = useFormik({
    initialValues: { name: '', institutionName: '', currentBalance: '' },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const balanceValue = Number(values.currentBalance || '0');
        await onSave({
          name: values.name.trim(),
          type,
          institutionName: values.institutionName.trim() || null,
          openingBalance: balanceValue,
          currentBalance: balanceValue,
          isDefault,
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
      values: {
        name: initialWallet?.name ?? '',
        institutionName: initialWallet?.institution_name ?? '',
        currentBalance: initialWallet ? toAmountString(initialWallet.current_balance ?? 0) : '',
      },
    });
    setType(initialWallet?.type ?? 'general');
    setIsDefault(Boolean(initialWallet?.is_default));
  }, [visible, initialWallet]);

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
                <View style={s.headerTextWrap}>
                  <Text style={[s.title, { color: theme.text }]}>
                    {mode === 'create' ? 'Add Wallet' : 'Edit Wallet'}
                  </Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>
                    Manage where your funds are stored.
                  </Text>
                </View>
                <Pressable onPress={handleRequestClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.formScroll}>
                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>WALLET NAME</Text>
                  <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <TextInput
                      value={formik.values.name}
                      onChangeText={formik.handleChange('name')}
                      onBlur={formik.handleBlur('name')}
                      placeholder="e.g. BPI Savings, GCash"
                      placeholderTextColor={theme.tertiary}
                      style={[s.input, { color: theme.text }]}
                      selectionColor={theme.lime}
                    />
                  </View>
                  {formik.touched.name && formik.errors.name ? (
                    <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '500', marginTop: 6 }}>
                      {formik.errors.name}
                    </Text>
                  ) : null}
                </View>

                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>TYPE</Text>
                  <View style={s.rowWrap}>
                    {WALLET_TYPES.map((option) => {
                      const active = type === option;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => setType(option)}
                          style={[
                            s.chip,
                            {
                              backgroundColor: active ? theme.lime : theme.surfaceAlt,
                              borderColor: active ? theme.lime : theme.border,
                            },
                          ]}
                        >
                          <Text style={[s.chipText, { color: active ? '#1A1E14' : theme.secondary }]}>
                            {WALLET_TYPE_LABELS[option].toUpperCase()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {(type === 'bank' || type === 'ewallet') && (
                  <View style={s.fieldGroup}>
                    <Text style={[s.sectionLabel, { color: theme.secondary }]}>INSTITUTION (OPTIONAL)</Text>
                    <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                      <TextInput
                        value={formik.values.institutionName}
                        onChangeText={formik.handleChange('institutionName')}
                        onBlur={formik.handleBlur('institutionName')}
                        placeholder={type === 'bank' ? 'e.g. BDO, BPI' : 'e.g. GCash, Maya'}
                        placeholderTextColor={theme.tertiary}
                        style={[s.input, { color: theme.text }]}
                        selectionColor={theme.lime}
                      />
                    </View>
                  </View>
                )}

                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>CURRENT BALANCE</Text>
                  <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <Text style={[s.currencyPrefix, { color: formik.values.currentBalance ? theme.text : theme.tertiary }]}>
                      {currencySymbol}
                    </Text>
                    <TextInput
                      value={formik.values.currentBalance}
                      onChangeText={(value) =>
                        formik.setFieldValue(
                          'currentBalance',
                          value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                        )
                      }
                      onBlur={formik.handleBlur('currentBalance')}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={theme.tertiary}
                      style={[s.input, { color: theme.text }]}
                      selectionColor={theme.lime}
                    />
                  </View>
                  {formik.touched.currentBalance && formik.errors.currentBalance ? (
                    <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '500', marginTop: 6 }}>
                      {formik.errors.currentBalance}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  onPress={() => setIsDefault((prev) => !prev)}
                  style={[s.defaultToggle, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                >
                  <Text style={[s.defaultToggleLabel, { color: theme.text }]}>Set as default wallet</Text>
                  <View
                    style={[
                      s.checkbox,
                      {
                        borderColor: isDefault ? theme.lime : theme.borderHighlight,
                        backgroundColor: isDefault ? theme.lime : 'transparent',
                      }
                    ]}
                  >
                    {isDefault && <Ionicons name="checkmark" size={14} color="#1A1E14" />}
                  </View>
                </Pressable>
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
                      {mode === 'create' ? 'Create Wallet' : 'Save Changes'}
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
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  defaultToggle: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
