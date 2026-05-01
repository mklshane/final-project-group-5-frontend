import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryRecord } from '@/types/finance';
import type { ReceiptItem } from '@/utils/receiptParser';

export interface ReceiptScanReviewDraft {
  title: string;
  amount: string;
  category: string;
  date: string;
  note: string;
  confidence: 'high' | 'medium' | 'low';
  items: ReceiptItem[];
}

interface ReceiptScanReviewModalProps {
  visible: boolean;
  imageUri: string | null;
  draft: ReceiptScanReviewDraft | null;
  categoryOptions: CategoryRecord[];
  warningMessage?: string | null;
  onClose: () => void;
  onRescan: () => void;
  onApply: (nextDraft: ReceiptScanReviewDraft) => void;
}

const confidenceLabelMap: Record<ReceiptScanReviewDraft['confidence'], string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

function formatAmountDisplay(raw: string): string {
  if (!raw) return '';
  const [intPart, decPart] = raw.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
}

function toIsoDate(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toIoniconName(icon: string | null | undefined): keyof typeof Ionicons.glyphMap | null {
  if (!icon) return null;
  if (icon in Ionicons.glyphMap) return icon as keyof typeof Ionicons.glyphMap;
  return null;
}

export function ReceiptScanReviewModal({
  visible,
  imageUri,
  draft,
  categoryOptions,
  warningMessage,
  onClose,
  onRescan,
  onApply,
}: ReceiptScanReviewModalProps) {
  const theme = useTheme();
  const [localDraft, setLocalDraft] = useState<ReceiptScanReviewDraft | null>(draft);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const maxSelectableDate = new Date();

  useEffect(() => {
    setLocalDraft(draft);
    setCategoryDropdownOpen(false);
    setShowAndroidDatePicker(false);
  }, [draft]);

  const confidenceColors = useMemo(() => {
    const confidence = localDraft?.confidence ?? 'low';
    if (confidence === 'high') {
      return {
        bg: theme.isDark ? 'rgba(61,217,123,0.12)' : 'rgba(61,217,123,0.16)',
        text: theme.green,
      };
    }
    if (confidence === 'medium') {
      return {
        bg: theme.isDark ? 'rgba(255,173,92,0.12)' : 'rgba(255,173,92,0.16)',
        text: theme.orange,
      };
    }
    return {
      bg: theme.isDark ? 'rgba(255,107,107,0.12)' : 'rgba(255,107,107,0.16)',
      text: theme.red,
    };
  }, [localDraft?.confidence, theme]);

  const parsedDate = useMemo(() => {
    if (!localDraft?.date) return new Date();
    const match = localDraft.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return new Date();
    const year = Number(match[1]);
    const today = new Date();
    if (year < 2000 || year > today.getFullYear()) return today;
    return new Date(year, Number(match[2]) - 1, Number(match[3]));
  }, [localDraft?.date]);

  const displayDate = useMemo(
    () => parsedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
    [parsedDate],
  );

  const activeCategory = useMemo(
    () =>
      localDraft
        ? categoryOptions.find(
            (c) => c.name.trim().toLowerCase() === localDraft.category.trim().toLowerCase(),
          ) ?? null
        : null,
    [categoryOptions, localDraft],
  );

  if (!localDraft) return null;

  const update = <K extends keyof ReceiptScanReviewDraft>(key: K, value: ReceiptScanReviewDraft[K]) => {
    setLocalDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowAndroidDatePicker(false);
    if (!selected) return;
    update('date', toIsoDate(selected));
  };

  const handleClose = () => {
    const isDirty =
      localDraft.title !== (draft?.title ?? '') ||
      localDraft.amount !== (draft?.amount ?? '') ||
      localDraft.category !== (draft?.category ?? '') ||
      localDraft.date !== (draft?.date ?? '') ||
      localDraft.note !== (draft?.note ?? '');

    const hasContent = localDraft.title.trim() !== '' || localDraft.amount !== '';

    if (isDirty || hasContent) {
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={[s.backdrop, { backgroundColor: theme.backdrop }]} onPress={handleClose} />
      <KeyboardAvoidingView
        style={s.avoidingWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={s.headerRow}>
            <Text style={[s.title, { color: theme.text }]}>Review scanned receipt</Text>
            <View style={[s.confidenceChip, { backgroundColor: confidenceColors.bg }]}>
              <Text style={[s.confidenceText, { color: confidenceColors.text }]}>{confidenceLabelMap[localDraft.confidence]}</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12} style={s.closeBtn}>
              <Ionicons name="close" size={20} color={theme.secondary} />
            </Pressable>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={[s.preview, { borderColor: theme.border }]} resizeMode="cover" />
            ) : null}

            {warningMessage ? (
              <View
                style={[
                  s.warningCard,
                  {
                    backgroundColor: theme.isDark ? 'rgba(230,108,106,0.12)' : 'rgba(230,108,106,0.08)',
                    borderColor: theme.red,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={theme.red} />
                <Text style={[s.warningText, { color: theme.red }]}>{warningMessage}</Text>
              </View>
            ) : null}

            {/* Title */}
            <View style={s.fieldBlock}>
              <Text style={[s.label, { color: theme.secondary }]}>Store or title</Text>
              <TextInput
                value={localDraft.title}
                onChangeText={(text) => update('title', text)}
                style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                placeholder="Scanned receipt"
                placeholderTextColor={theme.secondary}
              />
            </View>

            {/* Amount + Date */}
            <View style={s.row}>
              <View style={[s.fieldBlock, s.half]}>
                <Text style={[s.label, { color: theme.secondary }]}>Amount</Text>
                <TextInput
                  value={formatAmountDisplay(localDraft.amount)}
                  onChangeText={(text) =>
                    update(
                      'amount',
                      text.replace(/,/g, '').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'),
                    )
                  }
                  style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  placeholderTextColor={theme.secondary}
                />
              </View>

              <View style={[s.fieldBlock, s.half]}>
                <Text style={[s.label, { color: theme.secondary }]}>Date</Text>
                {Platform.OS === 'ios' ? (
                  <View style={[s.dateRow, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                    <Ionicons name="calendar-outline" size={15} color={theme.secondary} />
                    <DateTimePicker
                      value={parsedDate}
                      mode="date"
                      display="compact"
                      onChange={handleDateChange}
                      maximumDate={maxSelectableDate}
                      themeVariant={theme.isDark ? 'dark' : 'light'}
                      style={s.datePicker}
                    />
                  </View>
                ) : (
                  <>
                    <Pressable
                      onPress={() => setShowAndroidDatePicker(true)}
                      style={[s.dateRow, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                    >
                      <Ionicons name="calendar-outline" size={15} color={theme.secondary} />
                      <Text style={[s.dateText, { color: theme.text }]}>{displayDate}</Text>
                    </Pressable>
                    {showAndroidDatePicker ? (
                      <DateTimePicker
                        value={parsedDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        maximumDate={maxSelectableDate}
                      />
                    ) : null}
                  </>
                )}
              </View>
            </View>

            {/* Category dropdown */}
            <View style={s.fieldBlock}>
              <Text style={[s.label, { color: theme.secondary }]}>Category</Text>
              <Pressable
                onPress={() => setCategoryDropdownOpen((prev) => !prev)}
                style={[
                  s.dropdownTrigger,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: categoryDropdownOpen ? theme.limeDark : theme.border,
                  },
                ]}
              >
                <View style={s.dropdownValueWrap}>
                  {activeCategory ? (
                    <>
                      <View style={[s.categoryIconWrap, { backgroundColor: `${activeCategory.color ?? '#9DA28F'}20` }]}>
                        <Ionicons
                          name={toIoniconName(activeCategory.icon) ?? 'pricetag'}
                          size={14}
                          color={activeCategory.color ?? theme.text}
                        />
                      </View>
                      <Text style={[s.dropdownValueText, { color: theme.text }]} numberOfLines={1}>
                        {activeCategory.name}
                      </Text>
                    </>
                  ) : (
                    <>
                      <View style={[s.categoryDot, { backgroundColor: theme.secondary }]} />
                      <Text style={[s.dropdownValueText, { color: theme.secondary }]} numberOfLines={1}>
                        {localDraft.category || 'Select a category…'}
                      </Text>
                    </>
                  )}
                </View>
                <Ionicons
                  name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.secondary}
                />
              </Pressable>

              {categoryDropdownOpen && categoryOptions.length > 0 ? (
                <View style={[s.dropdownMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Pressable
                    onPress={() => {
                      update('category', '');
                      setCategoryDropdownOpen(false);
                    }}
                    style={[s.dropdownOption, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                  >
                    <View style={[s.categoryDot, { backgroundColor: theme.secondary }]} />
                    <Text style={[s.dropdownOptionText, { color: theme.text }]}>Uncategorized</Text>
                  </Pressable>

                  {categoryOptions.map((cat, index) => {
                    const isActive = cat.name.trim().toLowerCase() === localDraft.category.trim().toLowerCase();
                    const isLast = index === categoryOptions.length - 1;
                    const catColor = cat.color ?? theme.text;
                    const iconName = toIoniconName(cat.icon) ?? 'pricetag';
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          update('category', cat.name);
                          setCategoryDropdownOpen(false);
                        }}
                        style={[
                          s.dropdownOption,
                          !isLast && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                          isActive && {
                            backgroundColor: theme.isDark ? 'rgba(123,228,149,0.06)' : 'rgba(123,228,149,0.10)',
                          },
                        ]}
                      >
                        <View style={[s.categoryIconWrap, { backgroundColor: `${catColor}20` }]}>
                          <Ionicons name={iconName} size={14} color={catColor} />
                        </View>
                        <Text style={[s.dropdownOptionText, { color: isActive ? theme.limeDark : theme.text }]}>
                          {cat.name}
                        </Text>
                        {isActive ? <Ionicons name="checkmark" size={16} color={theme.limeDark} style={{ marginLeft: 'auto' }} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {/* Note */}
            <View style={s.fieldBlock}>
              <Text style={[s.label, { color: theme.secondary }]}>Note</Text>
              <TextInput
                value={localDraft.note}
                onChangeText={(text) => update('note', text)}
                style={[s.input, s.noteInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                placeholder="Optional note"
                placeholderTextColor={theme.secondary}
                multiline
              />
            </View>

          </ScrollView>

          {/* Fixed footer — always visible, never overlaps scroll content */}
          <View style={[s.actions, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={onRescan} style={[s.secondaryBtn, { borderColor: theme.border }]}>
              <Ionicons name="camera-reverse-outline" size={16} color={theme.text} />
              <Text style={[s.secondaryBtnText, { color: theme.text }]}>Rescan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onApply(localDraft)}
              style={[s.primaryBtn, { backgroundColor: '#3F7D36' }]}
            >
              <Text style={s.primaryBtnText}>Use this data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  avoidingWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    height: 675,
    paddingTop: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  confidenceChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  preview: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    borderWidth: 1,
  },
  warningCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  fieldBlock: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  dateRow: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePicker: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  dropdownTrigger: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dropdownValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  dropdownValueText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  categoryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 9,
  },
  dropdownMenu: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1.2,
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
