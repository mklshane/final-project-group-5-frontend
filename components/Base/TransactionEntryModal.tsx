import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { CURRENCIES } from '@/constants/currencies';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import type { CategoryRecord, WalletRecord } from '@/types/finance';

type TransactionMode = 'expense' | 'income';
type ActiveField = 'amount' | 'title';

type KeyLabel = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '+' | '-' | '=' | 'DEL' | 'CLR';

interface TransactionEntryModalProps {
  visible: boolean;
  mode: TransactionMode;
  wallets: WalletRecord[];
  categories: CategoryRecord[];
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    amount: number;
    type: TransactionMode;
    walletId: string | null;
    categoryId: string | null;
  }) => Promise<void>;
}

const KEYPAD_ROWS: KeyLabel[][] = [
  ['7', '8', '9', '+'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '='],
  ['.', '0', 'DEL', 'CLR'],
];

const formatCurrency = (value: number, symbol: string) => {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded < 0 ? '-' : ''}${symbol}${Math.abs(rounded).toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

const normalizeExpression = (value: string) => value.replace(/[^0-9.+-]/g, '').replace(/\s+/g, '');

const evaluateExpression = (value: string): number | null => {
  let expression = normalizeExpression(value);
  if (!expression) return null;

  if (expression[0] === '+') expression = expression.slice(1);
  if (expression[0] === '-') expression = `0${expression}`;

  while (expression.endsWith('+') || expression.endsWith('-')) {
    expression = expression.slice(0, -1);
  }

  if (!expression) return null;

  const parts = expression.split(/([+-])/).filter(Boolean);
  if (parts.length === 0) return null;

  const first = Number.parseFloat(parts[0]);
  if (!Number.isFinite(first)) return null;

  let result = first;
  for (let i = 1; i < parts.length; i += 2) {
    const operator = parts[i];
    const term = Number.parseFloat(parts[i + 1] ?? '');
    if (!Number.isFinite(term)) return null;

    if (operator === '+') result += term;
    if (operator === '-') result -= term;
  }

  return Math.round(result * 100) / 100;
};

const getExpressionText = (expression: string, historyExpression: string) => {
  if (historyExpression) return historyExpression;
  if (expression.includes('+') || expression.includes('-')) return expression;
  return '';
};

const pickDefaultWallet = (wallets: WalletRecord[]) => {
  return wallets.find((wallet) => wallet.is_default && !wallet.deleted_at)?.id ?? wallets[0]?.id ?? null;
};

const categoryMatchesMode = (category: CategoryRecord, mode: TransactionMode) => {
  if (category.deleted_at) return false;
  if (!category.type || category.type === 'both') return true;
  return category.type === mode;
};

const toIoniconName = (icon: string | null | undefined): keyof typeof Ionicons.glyphMap | null => {
  if (!icon) return null;
  if (icon in Ionicons.glyphMap) return icon as keyof typeof Ionicons.glyphMap;
  return null;
};

export function TransactionEntryModal({
  visible,
  mode,
  wallets,
  categories,
  onClose,
  onSubmit,
}: TransactionEntryModalProps) {
  const { colorScheme } = useColorScheme();
  const { currencyCode } = useAppPreferences();
  const isDark = colorScheme === 'dark';

  const [title, setTitle] = useState('');
  const [expression, setExpression] = useState('0');
  const [historyExpression, setHistoryExpression] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [insufficientFundsVisible, setInsufficientFundsVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>('title');

  const currencySymbol = useMemo(
    () => CURRENCIES.find((currency) => currency.code === currencyCode)?.symbol ?? '₱',
    [currencyCode]
  );

  const availableCategories = useMemo(
    () => categories.filter((category) => categoryMatchesMode(category, mode)),
    [categories, mode]
  );

  useEffect(() => {
    if (!visible) return;

    const defaultWalletId = pickDefaultWallet(wallets);
    const defaultCategoryId = availableCategories[0]?.id ?? null;

    setTitle('');
    setExpression('0');
    setHistoryExpression('');
    setSelectedWalletId(defaultWalletId);
    setSelectedCategoryId(defaultCategoryId);
    setCategoryDropdownOpen(false);
    setInsufficientFundsVisible(false);
    setActiveField('title');
    Keyboard.dismiss();
  }, [visible, mode, wallets, availableCategories]);

  const selectedCategory = useMemo(
    () => availableCategories.find((category) => category.id === selectedCategoryId) ?? null,
    [availableCategories, selectedCategoryId]
  );
  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === selectedWalletId) ?? null,
    [wallets, selectedWalletId]
  );

  const computedAmount = useMemo(() => evaluateExpression(expression) ?? 0, [expression]);
  const expressionText = getExpressionText(expression, historyExpression);

  const canSave =
    !submitting &&
    Boolean(selectedWalletId) &&
    Number.isFinite(computedAmount) &&
    computedAmount > 0 &&
    title.trim().length > 0;

  const onKeyPress = (key: KeyLabel) => {
    if (key === 'CLR') {
      setExpression('0');
      setHistoryExpression('');
      return;
    }

    if (key === 'DEL') {
      setExpression((prev) => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
      return;
    }

    if (key === '=') {
      const result = evaluateExpression(expression);
      if (result === null) return;
      setHistoryExpression(expression);
      setExpression(String(result));
      return;
    }

    if (key === '+' || key === '-') {
      setHistoryExpression('');
      setExpression((prev) => {
        const current = prev === '' ? '0' : prev;
        if (current.endsWith('+') || current.endsWith('-')) {
          return `${current.slice(0, -1)}${key}`;
        }
        return `${current}${key}`;
      });
      return;
    }

    if (key === '.') {
      setHistoryExpression('');
      setExpression((prev) => {
        const current = prev === '' ? '0' : prev;
        const activeTerm = current.split(/[+-]/).pop() ?? '';
        if (activeTerm.includes('.')) return current;
        if (current.endsWith('+') || current.endsWith('-')) return `${current}0.`;
        if (current === '0') return '0.';
        return `${current}.`;
      });
      return;
    }

    setHistoryExpression('');
    setExpression((prev) => {
      const current = prev === '' ? '0' : prev;
      if (current === '0') return key;
      const activeTerm = current.split(/[+-]/).pop() ?? '';
      if (activeTerm === '0') {
        return `${current.slice(0, -1)}${key}`;
      }
      return `${current}${key}`;
    });
  };

  const activateAmountInput = () => {
    setActiveField('amount');
    Keyboard.dismiss();
  };

  const submit = async () => {
    if (!canSave) return;

    const availableBalance = toNumber(selectedWallet?.current_balance);
    const isOverBalance = mode === 'expense' && computedAmount > availableBalance;
    if (isOverBalance) {
      setInsufficientFundsVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        amount: computedAmount,
        type: mode,
        walletId: selectedWalletId,
        categoryId: selectedCategoryId,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const palette = {
    backdrop: 'rgba(0,0,0,0.45)',
    cardBg: isDark ? '#12150F' : '#F5F6EE',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,30,20,0.12)',
    heading: isDark ? '#F1F4E8' : '#1A1E14',
    subtext: isDark ? '#8F9583' : '#6E7463',
    amount: isDark ? '#F1F4E8' : '#1A1E14',
    inputBg: isDark ? '#1A1E16' : '#FFFFFF',
    inputBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,30,20,0.14)',
    keyBg: isDark ? '#1A1F16' : '#FFFFFF',
    keyBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,30,20,0.12)',
    actionBg: '#93BC39',
    actionText: '#1A1E14',
    actionDisabledBg: isDark ? '#3E4335' : '#B5BAAA',
    chipBg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(26,30,20,0.03)',
    chipActiveBg: isDark ? 'rgba(147,188,57,0.22)' : 'rgba(147,188,57,0.18)',
    chipText: isDark ? '#E8ECDF' : '#1A1E14',
    chipActiveText: '#1A1E14',
    keypadPanelBg: isDark ? '#151A12' : '#EEF1E3',
    secondaryButtonBg: isDark ? '#2B3025' : '#E5E8DA',
    secondaryButtonText: isDark ? '#DCE1D1' : '#37422A',
    badgeBg: isDark ? 'rgba(147,188,57,0.24)' : 'rgba(147,188,57,0.2)',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={[styles.backdrop, { backgroundColor: palette.backdrop }]} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.modalTitle, { color: palette.heading }]}> 
                  {mode === 'expense' ? 'Add Expense' : 'Add Income'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: palette.subtext }]}> 
                  Use calculator input and assign wallet + category
                </Text>
              </View>

              <View style={styles.headerActions}>
                <View style={[styles.modeBadge, { backgroundColor: palette.badgeBg }]}> 
                  <Text style={styles.modeBadgeText}>{mode === 'expense' ? 'Expense' : 'Income'}</Text>
                </View>
                <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: palette.inputBorder }]}> 
                  <Ionicons name="close" size={16} color={palette.heading} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={activateAmountInput}
              style={[
                styles.amountPanel,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: activeField === 'amount' ? palette.actionBg : palette.inputBorder,
                },
              ]}
            >
              <Text style={[styles.amountLabel, { color: palette.subtext }]}>Amount</Text>
              <Text style={[styles.amountText, { color: palette.amount }]}>
                {formatCurrency(computedAmount, currencySymbol)}
              </Text>
              {expressionText ? (
                <Text style={[styles.expressionText, { color: palette.subtext }]} numberOfLines={1}>
                  {expressionText}
                </Text>
              ) : (
                <Text style={[styles.expressionHint, { color: palette.subtext }]}>Tap to edit amount</Text>
              )}
            </Pressable>

            <View style={[styles.sectionCard, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder }]}> 
              <Text style={[styles.selectorLabel, { color: palette.subtext }]}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                onFocus={() => setActiveField('title')}
                placeholder={mode === 'expense' ? 'What did you spend on?' : 'Income source'}
                placeholderTextColor={palette.subtext}
                style={[
                  styles.titleInput,
                  {
                    backgroundColor: isDark ? '#121610' : '#F8FAF2',
                    borderColor: activeField === 'title' ? palette.actionBg : palette.inputBorder,
                    color: palette.heading,
                  },
                ]}
              />
            </View>

            <View style={[styles.sectionCard, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder }]}> 
              <Text style={[styles.selectorLabel, { color: palette.subtext }]}>Wallet</Text>
              <View style={styles.chipsWrap}>
                {wallets.map((wallet) => {
                  const active = selectedWalletId === wallet.id;
                  return (
                    <Pressable
                      key={wallet.id}
                      onPress={() => setSelectedWalletId(wallet.id)}
                      style={[
                        styles.walletChip,
                        {
                          backgroundColor: active ? palette.chipActiveBg : palette.chipBg,
                          borderColor: active ? palette.actionBg : palette.inputBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? palette.chipActiveText : palette.chipText }]}> 
                        {wallet.name}
                      </Text>
                      <Text style={[styles.chipSubtext, { color: active ? '#2F3B18' : palette.subtext }]}> 
                        {formatCurrency(wallet.current_balance ?? 0, currencySymbol)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder }]}> 
              <Text style={[styles.selectorLabel, { color: palette.subtext }]}>Category</Text>
              <Pressable
                onPress={() => setCategoryDropdownOpen((prev) => !prev)}
                style={[
                  styles.dropdownTrigger,
                  {
                    backgroundColor: categoryDropdownOpen ? palette.chipActiveBg : palette.chipBg,
                    borderColor: categoryDropdownOpen ? palette.actionBg : palette.inputBorder,
                  },
                ]}
              >
                <View style={styles.dropdownValueWrap}>
                  {selectedCategory ? (
                    <>
                      <View
                        style={[
                          styles.categoryIconWrap,
                          { backgroundColor: `${selectedCategory.color ?? '#9DA28F'}22` },
                        ]}
                      >
                        {toIoniconName(selectedCategory.icon) ? (
                          <Ionicons
                            name={toIoniconName(selectedCategory.icon)!}
                            size={12}
                            color={selectedCategory.color ?? '#9DA28F'}
                          />
                        ) : (
                          <View style={[styles.categoryDot, { backgroundColor: selectedCategory.color ?? '#9DA28F' }]} />
                        )}
                      </View>
                      <Text style={[styles.dropdownValueText, { color: palette.chipText }]} numberOfLines={1}>
                        {selectedCategory.name}
                      </Text>
                    </>
                  ) : (
                    <>
                      <View style={[styles.categoryDot, { backgroundColor: '#9DA28F' }]} />
                      <Text style={[styles.dropdownValueText, { color: palette.chipText }]}>Uncategorized</Text>
                    </>
                  )}
                </View>

                <Ionicons
                  name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={palette.subtext}
                />
              </Pressable>

              {categoryDropdownOpen ? (
                <View style={[styles.dropdownMenu, { borderColor: palette.inputBorder, backgroundColor: palette.inputBg }]}> 
                  <Pressable
                    onPress={() => {
                      setSelectedCategoryId(null);
                      setCategoryDropdownOpen(false);
                    }}
                    style={[
                      styles.dropdownOption,
                      {
                        backgroundColor: selectedCategoryId === null ? palette.chipActiveBg : 'transparent',
                      },
                    ]}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: '#9DA28F' }]} />
                    <Text style={[styles.dropdownOptionText, { color: palette.chipText }]}>Uncategorized</Text>
                  </Pressable>

                  {availableCategories.map((category) => {
                    const active = selectedCategoryId === category.id;
                    const categoryColor = category.color ?? '#9DA28F';
                    const iconName = toIoniconName(category.icon);

                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => {
                          setSelectedCategoryId(category.id);
                          setCategoryDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownOption,
                          {
                            backgroundColor: active ? palette.chipActiveBg : 'transparent',
                          },
                        ]}
                      >
                        <View style={[styles.categoryIconWrap, { backgroundColor: `${categoryColor}22` }]}> 
                          {iconName ? (
                            <Ionicons name={iconName} size={12} color={categoryColor} />
                          ) : (
                            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                          )}
                        </View>
                        <Text style={[styles.dropdownOptionText, { color: palette.chipText }]} numberOfLines={1}>
                          {category.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {activeField === 'amount' ? (
              <View style={[styles.keypadWrap, { backgroundColor: palette.keypadPanelBg, borderColor: palette.inputBorder }]}> 
                {KEYPAD_ROWS.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                    {row.map((key) => {
                      const isAction = key === '=';
                      const isDelete = key === 'DEL' || key === 'CLR';

                      return (
                        <Pressable
                          key={key}
                          onPress={() => onKeyPress(key)}
                          style={[
                            styles.keyButton,
                            {
                              backgroundColor: isAction ? palette.actionBg : palette.keyBg,
                              borderColor: isAction ? palette.actionBg : palette.keyBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.keyLabel,
                              {
                                color: isAction
                                  ? palette.actionText
                                  : isDelete
                                    ? '#CF615E'
                                    : palette.heading,
                              },
                            ]}
                          >
                            {key}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.footerActions}>
              <Pressable
                onPress={onClose}
                style={[styles.cancelButton, { backgroundColor: palette.secondaryButtonBg }]}
              >
                <Text style={[styles.cancelLabel, { color: palette.secondaryButtonText }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void submit();
                }}
                disabled={!canSave}
                style={[
                  styles.submitButton,
                  { backgroundColor: canSave ? palette.actionBg : palette.actionDisabledBg },
                ]}
              >
                <Text style={[styles.submitLabel, { color: palette.actionText }]}> 
                  {submitting ? 'Saving...' : mode === 'expense' ? 'Save Expense' : 'Save Income'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={insufficientFundsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInsufficientFundsVisible(false)}
      >
        <Pressable
          style={[styles.warningBackdrop, { backgroundColor: palette.backdrop }]}
          onPress={() => setInsufficientFundsVisible(false)}
        />
        <View style={styles.warningContainer}>
          <View style={[styles.warningCard, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}> 
            <Text style={[styles.warningTitle, { color: palette.heading }]}>Insufficient balance</Text>
            <Text style={[styles.warningBody, { color: palette.subtext }]}> 
              This expense is higher than the available balance in
              {selectedWallet ? ` ${selectedWallet.name}` : ' the selected wallet'}.
            </Text>
            <Text style={[styles.warningDetail, { color: palette.heading }]}> 
              Available: {formatCurrency(toNumber(selectedWallet?.current_balance), currencySymbol)}
            </Text>

            <Pressable
              style={[styles.warningButton, { backgroundColor: palette.actionBg }]}
              onPress={() => setInsufficientFundsVisible(false)}
            >
              <Text style={[styles.warningButtonText, { color: palette.actionText }]}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const toNumber = (value: number | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: '93%',
  },
  sheetContent: {
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2C3913',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  amountPanel: {
    marginTop: 2,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  expressionText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  expressionHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.9,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
  },
  titleInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  walletChip: {
    minWidth: '47%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipSubtext: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryIconWrap: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  categoryIconText: {
    fontSize: 11,
    lineHeight: 12,
  },
  dropdownTrigger: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dropdownValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  dropdownValueText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownOption: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  keypadWrap: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  warningBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  warningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  warningCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  warningTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  warningBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  warningDetail: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  warningButton: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
