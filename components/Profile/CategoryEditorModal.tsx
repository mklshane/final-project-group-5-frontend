import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { DEFAULT_SYSTEM_CATEGORIES } from '@/constants/defaultCategories';
import type { CategoryRecord } from '@/types/finance';

const TYPE_OPTIONS: Array<'expense' | 'income' | 'both'> = ['expense', 'income', 'both'];

const ICON_OPTIONS = [...new Set(DEFAULT_SYSTEM_CATEGORIES.map((item) => item.icon))].slice(0, 18);
const COLOR_OPTIONS = [...new Set(DEFAULT_SYSTEM_CATEGORIES.map((item) => item.color))].slice(0, 12);

interface CategoryEditorModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initialCategory?: CategoryRecord | null;
  onClose: () => void;
  onSave: (input: {
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'income' | 'both';
  }) => Promise<void>;
}

export function CategoryEditorModal({
  visible,
  mode,
  initialCategory,
  onClose,
  onSave,
}: CategoryEditorModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'both'>('expense');
  const [icon, setIcon] = useState('apps-outline');
  const [color, setColor] = useState('#6C757D');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setName(initialCategory?.name ?? '');
    setType(initialCategory?.type ?? 'expense');
    setIcon(initialCategory?.icon ?? 'apps-outline');
    setColor(initialCategory?.color ?? '#6C757D');
  }, [visible, initialCategory]);

  const palette = useMemo(
    () => ({
      overlay: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(26,30,20,0.42)',
      card: isDark ? '#1A1E14' : '#FFFFFF',
      border: isDark ? '#2C3122' : '#E4E6D6',
      text: isDark ? '#EDF0E4' : '#1A1E14',
      sub: isDark ? '#8A8F7C' : '#6B7060',
      sectionLabel: isDark ? '#A6AD96' : '#6B7060',
      chipBg: isDark ? '#222618' : '#EEF0E2',
      chipBorder: isDark ? '#2C3122' : '#DDE1CF',
      chipActiveBg: isDark ? '#C8F560' : '#1A1E14',
      chipActiveText: isDark ? '#1A1E14' : '#C8F560',
      iconChipBg: isDark ? '#141812' : '#F8F9F2',
      iconColorIdle: isDark ? '#8A8F7C' : '#6B7060',
      colorActiveBorder: isDark ? '#EDF0E4' : '#111111',
      colorInactiveBorder: isDark ? '#2C3122' : 'transparent',
      inputBg: isDark ? '#111410' : '#F8F9F2',
      inputBorder: isDark ? '#2F3527' : '#DDE1CF',
      inputFocus: isDark ? '#C8F560' : '#1A1E14',
      inputText: isDark ? '#EDF0E4' : '#1A1E14',
      inputPlaceholder: isDark ? '#66705D' : '#9DA28F',
      cancelBg: isDark ? '#20251A' : '#EEF0E2',
      cancelBorder: isDark ? '#343B2A' : '#D7DDC8',
      cancelText: isDark ? '#EDF0E4' : '#1A1E14',
      submitBg: isDark ? '#C8F560' : '#1A1E14',
      submitText: isDark ? '#1A1E14' : '#C8F560',
      submitDisabled: isDark ? '#5A614B' : '#C8CEC0',
    }),
    [isDark]
  );

  const title = mode === 'create' ? 'Add Category' : 'Edit Category';
  const submitLabel = mode === 'create' ? 'Create Category' : 'Save Changes';

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        icon,
        color,
        type,
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
              <Text style={[s.title, { color: palette.text }]}>{title}</Text>
              <Text style={[s.subtitle, { color: palette.sub }]}>Name, type, icon and color can be customized anytime.</Text>

              <Text style={[s.sectionLabel, { color: palette.sectionLabel, marginTop: 2 }]}>CATEGORY NAME</Text>
              <View style={[s.inputWrap, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder }]}> 
                <TextInput
                  placeholder="e.g. Coffee, Side Hustle"
                  placeholderTextColor={palette.inputPlaceholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  style={[s.input, { color: palette.inputText }]}
                  selectionColor={palette.inputFocus}
                />
              </View>

              <Text style={[s.sectionLabel, { color: palette.sectionLabel }]}>TYPE</Text>
              <View style={s.rowWrap}>
                {TYPE_OPTIONS.map((option) => {
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
                      <Text style={[s.chipText, { color: active ? palette.chipActiveText : palette.sub }]}>{option.toUpperCase()}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[s.sectionLabel, { color: palette.sectionLabel }]}>ICON</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.horizontalList}
                keyboardShouldPersistTaps="handled"
              >
                {ICON_OPTIONS.map((iconName) => {
                  const active = icon === iconName;
                  return (
                    <Pressable
                      key={iconName}
                      onPress={() => setIcon(iconName)}
                      style={[
                        s.iconChip,
                        {
                          borderColor: active ? palette.chipActiveBg : palette.chipBorder,
                          backgroundColor: active ? `${palette.chipActiveBg}24` : palette.iconChipBg,
                        },
                      ]}
                    >
                      <Ionicons
                        name={iconName as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={active ? color : palette.iconColorIdle}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={[s.sectionLabel, { color: palette.sectionLabel }]}>COLOR</Text>
              <View style={s.rowWrap}>
                {COLOR_OPTIONS.map((colorValue) => {
                  const active = color === colorValue;
                  return (
                    <Pressable
                      key={colorValue}
                      onPress={() => setColor(colorValue)}
                      style={[
                        s.colorChip,
                        {
                          backgroundColor: colorValue,
                          borderColor: active ? palette.colorActiveBorder : palette.colorInactiveBorder,
                        },
                      ]}
                    />
                  );
                })}
              </View>

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
                    <Text style={[s.actionText, { color: palette.submitText }]}>{submitLabel}</Text>
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
    marginTop: 12,
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
  horizontalList: {
    gap: 8,
    paddingVertical: 2,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
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
