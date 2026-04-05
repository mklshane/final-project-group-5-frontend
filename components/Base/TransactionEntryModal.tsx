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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { CURRENCIES } from '@/constants/currencies';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import * as Haptics from 'expo-haptics';
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
  ['7', '8', '9', 'DEL'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '-'],
  ['.', '0', 'CLR', '='],
];

const formatCurrency = (value: number, symbol: string) => {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded < 0 ? '-' : ''}${Math.abs(rounded).toLocaleString(undefined, {
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
  const [activeField, setActiveField] = useState<ActiveField>('amount');

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
    setActiveField('amount');
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setInsufficientFundsVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  // Premium SaaS Fintech Palette
  const theme = {
    bg: isDark ? '#1A1E14' : '#F4F5E9',
    surface: isDark ? '#222618' : '#FFFFFF',
    surfaceAlt: isDark ? '#2C3122' : '#F8FAF2',
    border: isDark ? '#2C3122' : '#E4E6D6',
    borderHighlight: isDark ? '#3A402D' : '#D1D4C2',
    text: isDark ? '#EDF0E4' : '#1A1E14',
    secondary: isDark ? '#8A8F7C' : '#9DA28F',
    lime: '#C8F560',
    red: '#FF6B6B',
    green: '#3DD97B',
    keypadBg: isDark ? '#151810' : '#EEF0E2',
    keyBg: isDark ? '#222618' : '#FFFFFF',
    keypadText: isDark ? '#EDF0E4' : '#1A1E14',
    keyBorder: isDark ? '#333A28' : '#D9DDC8',
    keyDeleteBg: isDark ? 'rgba(255,107,107,0.14)' : 'rgba(255,107,107,0.12)',
    backdrop: 'rgba(0,0,0,0.65)',
  };

  const isExpense = mode === 'expense';
  const modeColor = isExpense ? theme.red : theme.green;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={[s.backdrop, { backgroundColor: theme.backdrop }]} onPress={onClose} />

        <View style={[s.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Drag Indicator */}
          <View style={s.dragHandleWrap}>
            <View style={[s.dragHandle, { backgroundColor: theme.borderHighlight }]} />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={s.headerRow}>
              <View style={s.headerTitleWrap}>
                <View style={[s.modeDot, { backgroundColor: modeColor }]} />
                <Text style={[s.modalTitle, { color: theme.text }]}>
                  New {isExpense ? 'Expense' : 'Income'}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={15} style={s.closeButton}>
                <Ionicons name="close" size={24} color={theme.secondary} />
              </Pressable>
            </View>

            {/* Massive Amount Input */}
            <Pressable onPress={activateAmountInput} style={s.amountContainer}>
              <Text style={[s.currencySymbol, { color: activeField === 'amount' ? theme.text : theme.secondary }]}>
                {currencySymbol}
              </Text>
              <Text 
                style={[s.amountText, { color: activeField === 'amount' ? theme.text : theme.secondary }]} 
                numberOfLines={1} 
                adjustsFontSizeToFit
              >
                {expressionText ? expressionText : formatCurrency(computedAmount, '')}
              </Text>
            </Pressable>

            {/* Title Input */}
            <View style={[s.inputRow, { borderBottomColor: activeField === 'title' ? theme.text : theme.border }]}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                onFocus={() => setActiveField('title')}
                placeholder="What was this for?"
                placeholderTextColor={theme.secondary}
                style={[s.titleInput, { color: theme.text }]}
                selectionColor={theme.lime}
              />
            </View>

            {/* Wallet Selection */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: theme.secondary }]}>Wallet</Text>
              <View style={s.walletGrid}>
                {wallets.map((wallet) => {
                  const active = selectedWalletId === wallet.id;
                  return (
                    <Pressable
                      key={wallet.id}
                      onPress={() => setSelectedWalletId(wallet.id)}
                      style={[
                        s.walletCard,
                        {
                          backgroundColor: active ? (isDark ? 'rgba(200,245,96,0.08)' : theme.surface) : theme.surfaceAlt,
                          borderColor: active ? theme.lime : theme.border,
                        },
                      ]}
                    >
                      <View style={s.walletCardTop}>
                        <Ionicons 
                          name="wallet" 
                          size={18} 
                          color={active ? theme.lime : theme.secondary} 
                        />
                        {active && <Ionicons name="checkmark-circle" size={16} color={theme.lime} />}
                      </View>
                      <Text style={[s.walletCardName, { color: active ? theme.text : theme.secondary }]} numberOfLines={1}>
                        {wallet.name}
                      </Text>
                      <Text style={[s.walletCardBalance, { color: active ? theme.text : theme.secondary }]}>
                        {formatCurrency(wallet.current_balance ?? 0, currencySymbol)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category Dropdown */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: theme.secondary }]}>Category</Text>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setCategoryDropdownOpen(!categoryDropdownOpen);
                }}
                style={[
                  s.dropdownTrigger,
                  {
                    backgroundColor: categoryDropdownOpen ? (isDark ? 'rgba(200,245,96,0.05)' : theme.surfaceAlt) : theme.surface,
                    borderColor: categoryDropdownOpen ? theme.lime : theme.border,
                  }
                ]}
              >
                <View style={s.dropdownValueWrap}>
                  {selectedCategory ? (
                    <>
                      <View style={[s.categoryIconWrap, { backgroundColor: `${selectedCategory.color ?? '#9DA28F'}20` }]}>
                        <Ionicons name={toIoniconName(selectedCategory.icon) ?? 'pricetag'} size={14} color={selectedCategory.color ?? theme.text} />
                      </View>
                      <Text style={[s.dropdownValueText, { color: theme.text }]}>{selectedCategory.name}</Text>
                    </>
                  ) : (
                    <>
                      <View style={[s.categoryDot, { backgroundColor: theme.secondary }]} />
                      <Text style={[s.dropdownValueText, { color: theme.secondary }]}>Select a category...</Text>
                    </>
                  )}
                </View>
                <Ionicons name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.secondary} />
              </Pressable>

              {/* Dropdown Menu Items */}
              {categoryDropdownOpen && (
                <View style={[s.dropdownMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Pressable
                    onPress={() => {
                      setSelectedCategoryId(null);
                      setCategoryDropdownOpen(false);
                    }}
                    style={[s.dropdownOption, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                  >
                    <View style={[s.categoryDot, { backgroundColor: theme.secondary }]} />
                    <Text style={[s.dropdownOptionText, { color: theme.text }]}>Uncategorized</Text>
                  </Pressable>
                  
                  {availableCategories.map((category, index) => {
                    const isLast = index === availableCategories.length - 1;
                    const iconName = toIoniconName(category.icon) ?? 'pricetag';
                    const isActive = selectedCategoryId === category.id;
                    const catColor = category.color ?? theme.text;
                    
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => {
                          setSelectedCategoryId(category.id);
                          setCategoryDropdownOpen(false);
                        }}
                        style={[
                          s.dropdownOption,
                          !isLast && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                          isActive && { backgroundColor: isDark ? 'rgba(200,245,96,0.05)' : 'rgba(200,245,96,0.1)' }
                        ]}
                      >
                        <View style={[s.categoryIconWrap, { backgroundColor: `${catColor}20` }]}>
                          <Ionicons name={iconName} size={14} color={catColor} />
                        </View>
                        <Text style={[s.dropdownOptionText, { color: isActive ? theme.lime : theme.text }]}>
                          {category.name}
                        </Text>
                        {isActive && <Ionicons name="checkmark" size={18} color={theme.lime} style={{ marginLeft: 'auto' }} />}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Keypad */}
            {activeField === 'amount' && (
              <View style={[s.keypadWrap, { backgroundColor: theme.keypadBg, borderColor: theme.borderHighlight }]}> 
                {KEYPAD_ROWS.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={s.keypadRow}>
                    {row.map((key, keyIndex) => {
                      const isAction = key === '=' || key === '+' || key === '-';
                      const isDelete = key === 'DEL' || key === 'CLR';
                      
                      let keyColor = theme.keypadText;
                      let bg = theme.keyBg;
                      let border = theme.keyBorder;

                      if (isAction) {
                        keyColor = '#1A1E14';
                        bg = theme.lime;
                        border = theme.lime;
                      }
                      if (isDelete) {
                        keyColor = theme.red;
                        bg = theme.keyDeleteBg;
                        border = isDark ? 'rgba(255,107,107,0.35)' : 'rgba(255,107,107,0.42)';
                      }

                      return (
                        <Pressable
                          key={key}
                          accessibilityRole="button"
                          onPress={() => onKeyPress(key)}
                          style={({ pressed }) => [
                            s.keyButton,
                            keyIndex < row.length - 1 && s.keyButtonRightSpacing,
                            rowIndex < KEYPAD_ROWS.length - 1 && s.keyButtonBottomSpacing,
                            { backgroundColor: bg, borderColor: border },
                            isDelete && s.keyDeleteButton,
                            isAction && s.keyActionButton,
                            !isAction && !isDelete && s.keyDefaultButton,
                            pressed && s.keyPressed,
                          ]}
                        >
                          <Text style={[s.keyLabel, { color: keyColor }]} numberOfLines={1}>
                            {key}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={s.footerActions}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  void submit();
                }}
                disabled={!canSave}
                style={[
                  s.submitButton,
                  { backgroundColor: canSave ? theme.lime : theme.surfaceAlt },
                  !canSave && { borderWidth: 1, borderColor: theme.border }
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={canSave ? "#1A1E14" : theme.secondary} />
                ) : (
                  <Text style={[s.submitLabel, { color: canSave ? '#1A1E14' : theme.secondary }]}>
                    Save {isExpense ? 'Expense' : 'Income'}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Warning Modal */}
      <Modal
        visible={insufficientFundsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInsufficientFundsVisible(false)}
      >
        <Pressable
          style={[s.warningBackdrop, { backgroundColor: theme.backdrop }]}
          onPress={() => setInsufficientFundsVisible(false)}
        />
        <View style={s.warningContainer}>
          <View style={[s.warningCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.warningIconWrap}>
               <Ionicons name="alert-circle" size={32} color={theme.red} />
            </View>
            <Text style={[s.warningTitle, { color: theme.text }]}>Insufficient Balance</Text>
            <Text style={[s.warningBody, { color: theme.secondary }]}>
              This expense is higher than the available balance in {selectedWallet?.name ?? 'the selected wallet'}.
            </Text>
            <View style={[s.warningDetailBox, { backgroundColor: theme.bg }]}>
               <Text style={[s.warningDetailLabel, { color: theme.secondary }]}>Available Balance</Text>
               <Text style={[s.warningDetailAmount, { color: theme.text }]}>
                 {formatCurrency(toNumber(selectedWallet?.current_balance), currencySymbol)}
               </Text>
            </View>

            <Pressable
              style={[s.warningButton, { backgroundColor: theme.lime }]}
              onPress={() => setInsufficientFundsVisible(false)}
            >
              <Text style={s.warningButtonText}>Got it</Text>
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

const s = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '94%',
  },
  dragHandleWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 8,
    marginTop: -8,
  },
  amountText: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
  },
  inputRow: {
    borderBottomWidth: 1.5,
    paddingBottom: 12,
    marginBottom: 32,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    padding: 0,
    margin: 0,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  
  // Wallet Grid
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  walletCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  walletCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletCardName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  walletCardBalance: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Category Dropdown
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  dropdownValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownValueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 6,
    marginRight: 6,
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    gap: 12,
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Keypad
  keypadWrap: {
    borderRadius: 24,
    width: '100%',
    alignSelf: 'stretch',
    padding: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 32,
  },
  keypadRow: {
    flexDirection: 'row',
    width: '100%',
  },
  keyButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
  },
  keyButtonRightSpacing: {
    marginRight: 10,
  },
  keyButtonBottomSpacing: {
    marginBottom: 10,
  },
  keyActionButton: {
    shadowColor: '#A2C94A',
    shadowOpacity: 0.42,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  keyDefaultButton: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  keyDeleteButton: {
    shadowColor: '#C8F560',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  keyPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.965 }],
  },
  keyLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  
  // Actions
  footerActions: {
    marginTop: 8,
  },
  submitButton: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Warning Modal
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
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  warningIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,107,107,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningBody: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  warningDetailBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  warningDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  warningDetailAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  warningButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningButtonText: {
    color: '#1A1E14',
    fontSize: 15,
    fontWeight: '800',
  },
});