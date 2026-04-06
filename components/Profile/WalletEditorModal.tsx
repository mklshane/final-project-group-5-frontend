import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
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
import { WALLET_TYPE_LABELS } from '@/constants/defaultWallets';
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

export function WalletEditorModal({
  visible,
  mode,
  initialWallet,
  onClose,
  onSave,
}: WalletEditorModalProps) {
  const theme = useTheme();
  const { isDark } = theme;

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('general');
  const [institutionName, setInstitutionName] = useState('');
  const [currentBalance, setCurrentBalance] = useState('0');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setName(initialWallet?.name ?? '');
    setType(initialWallet?.type ?? 'general');
    setInstitutionName(initialWallet?.institution_name ?? '');
    setCurrentBalance(String(initialWallet?.current_balance ?? 0));
    setIsDefault(Boolean(initialWallet?.is_default));
  }, [visible, initialWallet]);

  const submitDisabled = isDark ? '#5A614B' : '#C8CEC0';

  const handleSave = async () => {
    const trimmedName = name.trim();
    const balance = Number(currentBalance || '0');
    if (!trimmedName || !Number.isFinite(balance) || balance < 0) return;

    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        type,
        institutionName: institutionName.trim() ? institutionName.trim() : null,
        openingBalance: balance,
        currentBalance: balance,
        isDefault,
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
              <Text style={[s.title, { color: theme.text }]}>{mode === 'create' ? 'Add Wallet' : 'Edit Wallet'}</Text>
              <Text style={[s.subtitle, { color: theme.secondary }]}>Manage where your funds are stored.</Text>

              <Text style={[s.sectionLabel, { color: theme.secondary }]}>WALLET NAME</Text>
              <View style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. BPI Savings, GCash"
                  placeholderTextColor={theme.inputPlaceholder}
                  style={[s.input, { color: theme.text }]}
                />
              </View>

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
                          backgroundColor: active ? theme.lime : theme.chipBg,
                          borderColor: active ? theme.lime : theme.chipBorder,
                        },
                      ]}
                    >
                      <Text style={[s.chipText, { color: active ? theme.bg : theme.secondary }]}>
                        {WALLET_TYPE_LABELS[option].toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {(type === 'bank' || type === 'ewallet') && (
                <>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>INSTITUTION (OPTIONAL)</Text>
                  <View style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                    <TextInput
                      value={institutionName}
                      onChangeText={setInstitutionName}
                      placeholder={type === 'bank' ? 'e.g. BDO, BPI' : 'e.g. GCash, Maya'}
                      placeholderTextColor={theme.inputPlaceholder}
                      style={[s.input, { color: theme.text }]}
                    />
                  </View>
                </>
              )}

              <Text style={[s.sectionLabel, { color: theme.secondary }]}>CURRENT BALANCE</Text>
              <View style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  value={currentBalance}
                  onChangeText={(value) => setCurrentBalance(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor={theme.inputPlaceholder}
                  style={[s.input, { color: theme.text }]}
                />
              </View>

              <Pressable
                onPress={() => setIsDefault((prev) => !prev)}
                style={[s.defaultToggle, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
              >
                <Text style={[s.defaultToggleLabel, { color: theme.text }]}>Set as default wallet</Text>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isDefault ? theme.lime : theme.inputBorder,
                    backgroundColor: isDefault ? theme.lime : 'transparent',
                  }}
                />
              </Pressable>

              <View style={s.actions}>
                <Pressable
                  onPress={onClose}
                  style={[s.actionButton, s.half, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                >
                  <Text style={[s.actionText, { color: theme.text }]}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={() => void handleSave()}
                  disabled={!name.trim() || saving}
                  style={[
                    s.actionButton,
                    s.half,
                    {
                      backgroundColor: !name.trim() || saving ? submitDisabled : theme.lime,
                      borderColor: !name.trim() || saving ? submitDisabled : theme.lime,
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={theme.bg} />
                  ) : (
                    <Text style={[s.actionText, { color: theme.bg }]}>
                      {mode === 'create' ? 'Create Wallet' : 'Save Changes'}
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
    marginBottom: 14,
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
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  defaultToggle: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultToggleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 8,
  },
  half: {
    flex: 1,
  },
  actionButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
