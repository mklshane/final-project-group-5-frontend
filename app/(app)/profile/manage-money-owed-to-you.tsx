import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
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
  categoryOptions: string[];
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

  useEffect(() => {
    setLocalDraft(draft);
    setCategoryDropdownOpen(false);
  }, [draft]);

  useEffect(() => {
    if (!visible) setCategoryDropdownOpen(false);
  }, [visible]);

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

  if (!localDraft) return null;

  const update = <K extends keyof ReceiptScanReviewDraft>(key: K, value: ReceiptScanReviewDraft[K]) => {
    setLocalDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[s.overlay, { backgroundColor: theme.overlayModal }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View
            style={[
              s.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                maxHeight: Dimensions.get('window').height * 0.88,
              },
            ]}
          >
            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={s.headerRow}>
                <View style={s.headerTextWrap}>
                  <Text style={[s.modalTitle, { color: theme.text }]}>Review scanned receipt</Text>
                  <Text style={[s.subtitle, { color: theme.secondary }]}>Confirm the details before saving.</Text>
                </View>
                <View style={s.headerRight}>
                  <View style={[s.confidenceChip, { backgroundColor: confidenceColors.bg }]}> 
                    <Text style={[s.confidenceText, { color: confidenceColors.text }]}>{confidenceLabelMap[localDraft.confidence]}</Text>
                  </View>
                  <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
                    <Ionicons name="close" size={22} color={theme.tertiary} />
                  </Pressable>
                </View>
              </View>

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

              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>Store or title</Text>
                <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                  <TextInput
                    value={localDraft.title}
                    onChangeText={(text) => update('title', text)}
                    style={[s.input, { color: theme.text }]}
                    placeholder="Scanned receipt"
                    placeholderTextColor={theme.tertiary}
                  />
                </View>
              </View>

              <View style={s.row}>
                <View style={[s.fieldGroup, s.half]}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>Amount</Text>
                  <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                    <TextInput
                      value={localDraft.amount}
                      onChangeText={(text) =>
                        update('amount', text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))
                      }
                      style={[s.input, { color: theme.text }]}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      placeholderTextColor={theme.tertiary}
                    />
                  </View>
                </View>
                <View style={[s.fieldGroup, s.half]}>
                  <Text style={[s.sectionLabel, { color: theme.secondary }]}>Date</Text>
                  <View style={[s.inputWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                    <TextInput
                      value={localDraft.date}
                      onChangeText={(text) => update('date', text)}
                      style={[s.input, { color: theme.text }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.tertiary}
                    />
                  </View>
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>Category</Text>
                {categoryOptions.length === 0 ? (
                  <Text style={[s.emptyHint, { color: theme.tertiary }]}>No categories available.</Text>
                ) : (
                  <>
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
                        <Ionicons 
                          name="pricetag-outline" 
                          size={18} 
                          color={localDraft.category ? theme.text : theme.secondary} 
                        />
                        {localDraft.category ? (
                          <Text style={[s.dropdownValueText, { color: theme.text }]} numberOfLines={1}>
                            {localDraft.category}
                          </Text>
                        ) : (
                          <Text style={[s.dropdownValueText, { color: theme.secondary }]}>
                            Select a category...
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.secondary}
                      />
                    </Pressable>
                    {categoryDropdownOpen ? (
                      <View style={[s.dropdownMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                        {categoryOptions.map((categoryName, index) => {
                          const isLast = index === categoryOptions.length - 1;
                          const isActive = categoryName.trim().toLowerCase() === localDraft.category.trim().toLowerCase();
                          return (
                            <Pressable
                              key={categoryName}
                              onPress={() => {
                                update('category', categoryName);
                                setCategoryDropdownOpen(false);
                              }}
                              style={[
                                s.dropdownOption,
                                !isLast && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                                isActive && { backgroundColor: theme.isDark ? 'rgba(155,194,58,0.08)' : 'rgba(155,194,58,0.12)' },
                              ]}
                            >
                              <Ionicons 
                                name={isActive ? "pricetag" : "pricetag-outline"} 
                                size={18} 
                                color={isActive ? theme.limeDark : theme.secondary} 
                              />
                              <Text style={[s.dropdownOptionText, { color: isActive ? theme.limeDark : theme.text }]} numberOfLines={1}>
                                {categoryName}
                              </Text>
                              {isActive ? (
                                <Ionicons name="checkmark" size={16} color={theme.limeDark} style={{ marginLeft: 'auto' }} />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </>
                )}
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.sectionLabel, { color: theme.secondary }]}>Note</Text>
                <View style={[s.inputWrap, s.noteWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                  <TextInput
                    value={localDraft.note}
                    onChangeText={(text) => update('note', text)}
                    style={[s.input, s.noteInput, { color: theme.text }]}
                    placeholder="Optional note"
                    placeholderTextColor={theme.tertiary}
                    multiline
                  />
                </View>
              </View>

              {localDraft.items.length > 0 ? (
                <View style={[s.itemsCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
                  <Text style={[s.itemsTitle, { color: theme.text }]}>Detected items</Text>
                  {localDraft.items.slice(0, 6).map((item, index) => (
                    <View key={`${item.name}-${index}`} style={s.itemRow}>
                      <Text style={[s.itemName, { color: theme.secondary }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[s.itemAmount, { color: theme.text }]}>₱{item.totalPrice.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={s.actions}>
                <TouchableOpacity onPress={onRescan} style={[s.secondaryBtn, { borderColor: theme.border }]}> 
                  <Ionicons name="camera-reverse-outline" size={16} color={theme.text} />
                  <Text style={[s.secondaryBtnText, { color: theme.text }]}>Rescan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onApply(localDraft)}
                  style={[s.primaryBtn, { backgroundColor: theme.isDark ? theme.lime : '#3F7D36' }]}
                >
                  <Text style={[s.primaryBtnText, { color: theme.isDark ? '#1A1E14' : '#FFFFFF' }]}>Use this data</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ManageMoneyOwedToYouScreen() {
  const theme = useTheme();

  return (
    <View style={[s.screenFallback, { backgroundColor: theme.bg }]}>
      <Text style={[s.screenTitle, { color: theme.text }]}>Manage money owed to you</Text>
      <Text style={[s.screenSubtitle, { color: theme.secondary }]}>This screen is not wired yet.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  screenFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 10,
  },
  closeBtn: {
    backgroundColor: 'transparent',
    padding: 4,
    borderRadius: 12,
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
  fieldGroup: {
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 2,
    marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  noteWrap: {
    minHeight: 96,
    alignItems: 'flex-start',
    paddingVertical: 12, // Added padding to wrap instead of forcing height
  },
  noteInput: {
    flex: 1,
    width: '100%',
    height: undefined, // Removes the height: '100%' inheritance that breaks multiline boundaries
    textAlignVertical: 'top',
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  dropdownValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownValueText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
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
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});