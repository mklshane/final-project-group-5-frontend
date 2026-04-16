import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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

  const isValid = name.trim().length > 0;

  // Custom Light Mode Theming requested
  const primaryBg = isDark ? theme.lime : '#3F7D36';
  const primaryText = isDark ? '#1A1E14' : '#FFFFFF';
  const submitDisabledColor = isDark ? '#2C3122' : '#E4E6D6';
  const iconActiveBg = isDark ? 'rgba(200,245,96,0.15)' : 'rgba(63,125,54,0.12)';

  const colorActiveBorder = isDark ? '#EDF0E4' : '#111111';
  const colorInactiveBorder = isDark ? '#2C3122' : 'transparent';
  const iconColorIdle = isDark ? '#8A8F7C' : '#6B7060';

  const title = mode === 'create' ? 'Add Category' : 'Edit Category';
  const submitLabel = mode === 'create' ? 'Create Category' : 'Save Changes';

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!isValid || saving) return;

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
              
              <View style={s.headerRow}>
                <View style={s.headerTextWrap}>
                  <Text style={[s.title, { color: theme.text }]}>{title}</Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>
                    Customize category details, icon, and colors.
                  </Text>
                </View>
                <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.tertiary} />
                </Pressable>
              </View>

              <View style={s.formScroll}>
                <View style={s.fieldGroup}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>CATEGORY NAME</Text>
                  <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <TextInput
                      placeholder="e.g. Coffee, Side Hustle"
                      placeholderTextColor={theme.tertiary}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      style={[s.input, { color: theme.text }]}
                      selectionColor={primaryBg}
                    />
                  </View>
                </View>

                <View style={s.fieldGroup}>
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
                              backgroundColor: active ? primaryBg : theme.surfaceAlt,
                              borderColor: active ? primaryBg : theme.border,
                            },
                          ]}
                        >
                          <Text style={[s.chipText, { color: active ? primaryText : theme.secondary }]}>
                            {option.toUpperCase()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={s.fieldGroup}>
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
                              borderColor: active ? primaryBg : theme.border,
                              backgroundColor: active ? iconActiveBg : theme.surfaceAlt,
                            },
                          ]}
                        >
                          <Ionicons
                            name={iconName as keyof typeof Ionicons.glyphMap}
                            size={20}
                            color={active ? color : iconColorIdle}
                          />
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={s.fieldGroup}>
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
                              transform: [{ scale: active ? 1.1 : 1 }],
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={s.actions}>
                <Pressable
                  onPress={() => void handleSave()}
                  disabled={!isValid || saving}
                  style={[
                    s.actionButton,
                    {
                      backgroundColor: !isValid || saving ? submitDisabledColor : primaryBg,
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={primaryText} />
                  ) : (
                    <Text style={[s.actionText, { color: !isValid || saving ? theme.tertiary : primaryText }]}>
                      {submitLabel}
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
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  input: {
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
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  horizontalList: {
    gap: 10,
    paddingVertical: 4,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
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