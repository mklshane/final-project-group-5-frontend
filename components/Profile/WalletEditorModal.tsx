import { useColorScheme } from 'nativewind';
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  const palette = useMemo(
    () => ({
      overlay: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(26,30,20,0.42)',
      card: isDark ? '#1A1E14' : '#FFFFFF',
      border: isDark ? '#2C3122' : '#E4E6D6',
      text: isDark ? '#EDF0E4' : '#1A1E14',
      sub: isDark ? '#8A8F7C' : '#6B7060',
      sectionLabel: isDark ? '#A6AD96' : '#6B7060',
      inputBg: isDark ? '#111410' : '#F8F9F2',
      inputBorder: isDark ? '#2F3527' : '#DDE1CF',
      inputText: isDark ? '#EDF0E4' : '#1A1E14',
      inputPlaceholder: isDark ? '#66705D' : '#9DA28F',
      chipBg: isDark ? '#222618' : '#EEF0E2',
      chipBorder: isDark ? '#2C3122' : '#DDE1CF',
      chipActiveBg: isDark ? '#C8F560' : '#1A1E14',
      chipActiveText: isDark ? '#1A1E14' : '#C8F560',
      cancelBg: isDark ? '#20251A' : '#EEF0E2',
      cancelBorder: isDark ? '#343B2A' : '#D7DDC8',
      cancelText: isDark ? '#EDF0E4' : '#1A1E14',
      submitBg: isDark ? '#C8F560' : '#1A1E14',
      submitText: isDark ? '#1A1E14' : '#C8F560',
      submitDisabled: isDark ? '#5A614B' : '#C8CEC0',
    }),
    [isDark]
  );

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
        style={[s.overlay, { backgroundColor: palette.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View>
            <View style={[s.card, { backgroundColor: palette.card, borderColor: palette.border }]}> 
              <Text style={[s.title, { color: palette.text }]}>{mode === 'create' ? 'Add Wallet' : 'Edit Wallet'}</Text>
              <Text style={[s.subtitle, { color: palette.sub }]}>Manage where your funds are stored.</Text>

              <Text style={[s.sectionLabel, { color: palette.sectionLabel }]}>WALLET NAME</Text>
              <View style={[s.inputWrap, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder }]}> 
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. BPI Savings, GCash"
                  placeholderTextColor={palette.inputPlaceholder}
                  style={[s.input, { color: palette.inputText }]}
                />
              </View>

              <Text style={[s.sectionLabel, { color: palette.sectionLabel }]}>TYPE</Text>
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
                          backgroundColor: active ? palette.chipActiveBg : palette.chipBg,
                          borderColor: active ? palette.chipActiveBg : palette.chipBorder,
                        },
                      ]}
                    >
                      <Text style={[s.chipText, { color: active ? palette.chipActiveText : palette.sub }]}>
                        {WALLET_TYPE_LABELS[option].toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {(type === 'bank' || type === 'ewallet') && (
                <>
                  <Text style={[s.sectionLabel, { color: palette.sectionLabel }]}>INSTITUTION (OPTIONAL)</Text>
                  <View style={[s.inputWrap, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder }]}> 
                    <TextInput
                      value={institutionName}
                      onChangeText={setInstitutionName}
                      placeholder={type === 'bank' ? 'e.g. BDO, BPI' : 'e.g. GCash, Maya'}
                      placeholderTextColor={palette.inputPlaceholder}
                      style={[s.input, { color: palette.inputText }]}
                    />
                  </View>
                </>
              )}

              <Text style={[s.sectionLabel, { color: palette.sectionLabel }]}>CURRENT BALANCE</Text>
              <View style={[s.inputWrap, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder }]}> 
                <TextInput
                  value={currentBalance}
                  onChangeText={(value) => setCurrentBalance(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor={palette.inputPlaceholder}
                  style={[s.input, { color: palette.inputText }]}
                />
              </View>

              <Pressable
                onPress={() => setIsDefault((prev) => !prev)}
                style={[s.defaultToggle, { borderColor: palette.inputBorder, backgroundColor: palette.inputBg }]}
              >
                <Text style={[s.defaultToggleLabel, { color: palette.text }]}>Set as default wallet</Text>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isDefault ? palette.chipActiveBg : palette.inputBorder,
                    backgroundColor: isDefault ? palette.chipActiveBg : 'transparent',
                  }}
                />
              </Pressable>

              <View style={s.actions}>
                <Pressable
                  onPress={onClose}
                  style={[s.actionButton, s.half, { backgroundColor: palette.cancelBg, borderColor: palette.cancelBorder }]}
                >
                  <Text style={[s.actionText, { color: palette.cancelText }]}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={() => void handleSave()}
                  disabled={!name.trim() || saving}
                  style={[
                    s.actionButton,
                    s.half,
                    {
                      backgroundColor: !name.trim() || saving ? palette.submitDisabled : palette.submitBg,
                      borderColor: !name.trim() || saving ? palette.submitDisabled : palette.submitBg,
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={palette.submitText} />
                  ) : (
                    <Text style={[s.actionText, { color: palette.submitText }]}>
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
