import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

  useEffect(() => {
    setLocalDraft(draft);
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

  if (!localDraft) return null;

  const update = <K extends keyof ReceiptScanReviewDraft>(key: K, value: ReceiptScanReviewDraft[K]) => {
    setLocalDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[s.backdrop, { backgroundColor: theme.backdrop }]} onPress={onClose} />
      <View style={s.wrap}>
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <View style={s.headerRow}>
            <Text style={[s.title, { color: theme.text }]}>Review scanned receipt</Text>
            <View style={[s.confidenceChip, { backgroundColor: confidenceColors.bg }]}> 
              <Text style={[s.confidenceText, { color: confidenceColors.text }]}>{confidenceLabelMap[localDraft.confidence]}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
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

            <View style={s.row}>
              <View style={[s.fieldBlock, s.half]}>
                <Text style={[s.label, { color: theme.secondary }]}>Amount</Text>
                <TextInput
                  value={localDraft.amount}
                  onChangeText={(text) =>
                    update('amount', text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))
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
                <TextInput
                  value={localDraft.date}
                  onChangeText={(text) => update('date', text)}
                  style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.secondary}
                />
              </View>
            </View>

            <View style={s.fieldBlock}>
              <Text style={[s.label, { color: theme.secondary }]}>Category</Text>
              <TextInput
                value={localDraft.category}
                onChangeText={(text) => update('category', text)}
                style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                placeholder="Category name"
                placeholderTextColor={theme.secondary}
              />
              {categoryOptions.length > 0 ? (
                <View style={s.categoryChipWrap}>
                  {categoryOptions.slice(0, 10).map((categoryName) => {
                    const active = categoryName.trim().toLowerCase() === localDraft.category.trim().toLowerCase();
                    return (
                      <TouchableOpacity
                        key={categoryName}
                        onPress={() => update('category', categoryName)}
                        style={[
                          s.categoryChip,
                          {
                            backgroundColor: active
                              ? (theme.isDark ? 'rgba(200,245,96,0.16)' : 'rgba(155,194,58,0.2)')
                              : theme.surfaceAlt,
                            borderColor: active ? theme.limeDark : theme.border,
                          },
                        ]}
                      >
                        <Text style={[s.categoryChipText, { color: active ? theme.limeDark : theme.secondary }]}>
                          {categoryName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>

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
          </ScrollView>

          <View style={s.actions}>
            <TouchableOpacity onPress={onRescan} style={[s.secondaryBtn, { borderColor: theme.border }]}>
              <Ionicons name="camera-reverse-outline" size={16} color={theme.text} />
              <Text style={[s.secondaryBtnText, { color: theme.text }]}>Rescan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onApply(localDraft)}
              style={[s.primaryBtn, { backgroundColor: theme.lime }]}
            >
              <Text style={s.primaryBtnText}>Use this data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    maxHeight: '88%',
    paddingTop: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  categoryChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemsCard: {
    borderWidth: 1,
    borderRadius: 12,
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
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.4)',
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
    color: '#1A1E14',
    fontSize: 14,
    fontWeight: '800',
  },
});
