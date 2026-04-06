import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
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
  const theme = useTheme();
  const { isDark } = theme;

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

  const colorActiveBorder = isDark ? '#EDF0E4' : '#111111';
  const colorInactiveBorder = isDark ? '#2C3122' : 'transparent';
  const iconChipBg = isDark ? '#141812' : '#F8F9F2';
  const iconColorIdle = isDark ? '#8A8F7C' : '#6B7060';
  const submitDisabled = isDark ? '#5A614B' : '#C8CEC0';

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
        style={[s.overlay, { backgroundColor: theme.overlayModal }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View>
            <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.title, { color: theme.text }]}>{title}</Text>
              <Text style={[s.subtitle, { color: theme.secondary }]}>Name, type, icon and color can be customized anytime.</Text>

              <Text style={[s.sectionLabel, { color: theme.secondary, marginTop: 2 }]}>CATEGORY NAME</Text>
              <View style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  placeholder="e.g. Coffee, Side Hustle"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  style={[s.input, { color: theme.text }]}
                  selectionColor={theme.lime}
                />
              </View>

              <Text style={[s.sectionLabel, { color: theme.secondary }]}>TYPE</Text>
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
                          backgroundColor: active ? theme.lime : theme.chipBg,
                          borderColor: active ? theme.lime : theme.chipBorder,
                        },
                      ]}
                    >
                      <Text style={[s.chipText, { color: active ? theme.bg : theme.secondary }]}>{option.toUpperCase()}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[s.sectionLabel, { color: theme.secondary }]}>ICON</Text>
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
                          borderColor: active ? theme.lime : theme.chipBorder,
                          backgroundColor: active ? `${theme.lime}24` : iconChipBg,
                        },
                      ]}
                    >
                      <Ionicons
                        name={iconName as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={active ? color : iconColorIdle}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={[s.sectionLabel, { color: theme.secondary }]}>COLOR</Text>
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
                          borderColor: active ? colorActiveBorder : colorInactiveBorder,
                        },
                      ]}
                    />
                  );
                })}
              </View>

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
                    <Text style={[s.actionText, { color: theme.bg }]}>{submitLabel}</Text>
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
