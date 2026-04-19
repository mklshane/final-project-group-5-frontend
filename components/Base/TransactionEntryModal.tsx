import { useEffect, useMemo, useRef, useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  Animated,
  Keyboard,
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
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { CURRENCIES } from '@/constants/currencies';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import * as Haptics from 'expo-haptics';
import type { CategoryRecord, WalletRecord } from '@/types/finance';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';

type TransactionMode = 'expense' | 'income';
type ActiveField = 'amount' | 'title' | 'other';

type KeyLabel = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '+' | '-' | '=' | 'DEL' | 'CLR';

interface TransactionEntryModalProps {
  visible: boolean;
  mode: TransactionMode;
  scanRequestId?: number | null;
  wallets: WalletRecord[];
  categories: CategoryRecord[];
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    amount: number;
    type: TransactionMode;
    walletId: string | null;
    categoryId: string | null;
    loggedAt: Date;
  }) => Promise<void>;
}

const KEYPAD_ROWS: KeyLabel[][] = [
  ['7', '8', '9', 'DEL'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '-'],
  ['.', '0', 'CLR', '='],
];

const formatCurrency = (value: number, _symbol: string) => {
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

const toIsoDate = (date: Date) => {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseIsoDate = (value: string | null): Date | null => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (!Number.isFinite(date.getTime())) return null;
  return date;
};

const findCategoryIdByExactName = (name: string, categories: CategoryRecord[]) => {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;
  return categories.find((category) => category.name.trim().toLowerCase() === normalized)?.id ?? null;
};

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const RECEIPT_CATEGORY_HINTS: Record<string, string[]> = {
  food: ['food', 'restaurant', 'cafe', 'coffee', 'grocery', 'market', 'jollibee', 'mcdonald', 'kfc', 'chowking'],
  transport: ['transport', 'grab', 'angkas', 'taxi', 'fuel', 'petrol', 'gas', 'parking', 'bus', 'mrt', 'lrt'],
  shopping: ['shopping', 'shop', 'store', 'mall', 'shopee', 'lazada', 'clothes', 'fashion', 'department'],
  bills: ['bill', 'utility', 'utilities', 'electric', 'water', 'internet', 'phone', 'subscription', 'rent', 'pldt', 'meralco'],
  health: ['health', 'medical', 'hospital', 'clinic', 'pharmacy', 'drug', 'medicine', 'watsons', 'mercury'],
  education: ['education', 'school', 'university', 'tuition', 'book', 'supplies'],
  entertainment: ['entertainment', 'movie', 'cinema', 'concert', 'arcade', 'karaoke'],
};

const guessCategoryNameFromReceipt = (
  parserSuggested: string,
  rawText: string,
  availableCategories: CategoryRecord[]
) => {
  if (availableCategories.length === 0) return parserSuggested;

  const normalizedSuggestion = parserSuggested.trim().toLowerCase();
  const exact = availableCategories.find((category) => category.name.trim().toLowerCase() === normalizedSuggestion);
  if (exact) return exact.name;

  const fuzzyByName = availableCategories.find((category) => {
    const categoryName = category.name.trim().toLowerCase();
    return categoryName.includes(normalizedSuggestion) || normalizedSuggestion.includes(categoryName);
  });
  if (fuzzyByName) return fuzzyByName.name;

  const hintWords = RECEIPT_CATEGORY_HINTS[normalizedSuggestion] ?? [];
  if (hintWords.length === 0) return parserSuggested;

  const receiptTokens = tokenize(rawText);
  const scoreForCategory = (categoryName: string) => {
    const nameTokens = tokenize(categoryName);
    let score = 0;
    for (const token of nameTokens) {
      if (hintWords.includes(token)) score += 5;
    }
    for (const hint of hintWords) {
      if (receiptTokens.includes(hint)) {
        for (const token of nameTokens) {
          if (token.includes(hint) || hint.includes(token)) score += 2;
        }
      }
    }
    return score;
  };

  let best: CategoryRecord | null = null;
  let bestScore = 0;
  for (const category of availableCategories) {
    const score = scoreForCategory(category.name);
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  return best ? best.name : parserSuggested;
};

export function TransactionEntryModal({
  visible,
  mode,
  scanRequestId,
  wallets,
  categories,
  onClose,
  onSubmit,
}: TransactionEntryModalProps) {
  const theme = useTheme();
  const { isDark } = theme;
  const { currencyCode } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const keypadAnim = useRef(new Animated.Value(0)).current;
  const titleInputRef = useRef<TextInput>(null);
  const lastHandledScanRequestRef = useRef<number | null>(null);

  const [title, setTitle] = useState('');
  const [expression, setExpression] = useState('0');
  const [historyExpression, setHistoryExpression] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [insufficientFundsVisible, setInsufficientFundsVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>('amount');
  const [customLoggedAt, setCustomLoggedAt] = useState<Date | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [awaitingFreshScanResult, setAwaitingFreshScanResult] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const {
    status: scanStatus,
    result: scanResult,
    error: scanError,
    imageUri: scanImageUri,
    scanFromCamera,
    scanFromGallery,
    reset: resetScanner,
  } = useReceiptScanner();

  const wasVisibleRef = useRef(false);
  const slideAnim = useRef(new Animated.Value(700)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const currencySymbol = useMemo(
    () => CURRENCIES.find((currency) => currency.code === currencyCode)?.symbol ?? '₱',
    [currencyCode]
  );

  const availableCategories = useMemo(
    () =>
      categories
        .filter((category) => categoryMatchesMode(category, mode))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [categories, mode]
  );

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      setIsClosing(false);
      return;
    }

    // Only reset form state when the modal transitions from hidden → visible.
    // Skipping when wallets/categories update while already open prevents a
    // flash of the empty form before the modal finishes closing.
    if (wasVisibleRef.current) return;
    wasVisibleRef.current = true;

    const defaultWalletId = pickDefaultWallet(wallets);
    const defaultCategoryId = null;

    setTitle('');
    setExpression('0');
    setHistoryExpression('');
    setSelectedWalletId(defaultWalletId);
    setSelectedCategoryId(defaultCategoryId);
    setCategoryDropdownOpen(false);
    setInsufficientFundsVisible(false);
    setActiveField('amount');
    setCustomLoggedAt(null);
    setScannerVisible(false);
    setAwaitingFreshScanResult(false);
    setIsClosing(false);
    resetScanner();
    keypadAnim.setValue(0);
    Keyboard.dismiss();

    // Slide the sheet up
    slideAnim.setValue(700);
    backdropAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 300,
        mass: 0.9,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, mode, wallets, availableCategories, resetScanner, keypadAnim, slideAnim, backdropAnim]);

  useEffect(() => {
    Animated.spring(keypadAnim, {
      toValue: activeField === 'amount' ? 0 : 420,
      useNativeDriver: true,
      damping: 22,
      mass: 0.85,
      stiffness: 260,
    }).start();
  }, [activeField, keypadAnim]);

  useEffect(() => {
    if (!visible || mode !== 'expense') return;
    if (scanRequestId == null) return;
    if (lastHandledScanRequestRef.current === scanRequestId) return;

    lastHandledScanRequestRef.current = scanRequestId;
    setActiveField('other');
    Keyboard.dismiss();
    setAwaitingFreshScanResult(false);
    resetScanner();
    setScannerVisible(true);
  }, [visible, mode, scanRequestId, resetScanner]);

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

  useEffect(() => {
    if (!scannerVisible) return;
    if (!awaitingFreshScanResult) return;
    if (scanStatus !== 'done' || !scanResult) return;

    const itemNote = scanResult.items.length
      ? scanResult.items.map((item) => `${item.name} (₱${item.totalPrice.toFixed(2)})`).join(', ')
      : '';

    const autoCategory = guessCategoryNameFromReceipt(
      scanResult.suggestedCategory,
      `${scanResult.rawText} ${scanResult.storeName ?? ''}`,
      availableCategories
    );

    const normalizedTitle = scanResult.storeName?.trim() || 'Scanned receipt';
    const normalizedAmount =
      typeof scanResult.totalAmount === 'number' && Number.isFinite(scanResult.totalAmount) && scanResult.totalAmount > 0
        ? Math.round(scanResult.totalAmount * 100) / 100
        : null;
    const matchedCategoryId = findCategoryIdByExactName(autoCategory, availableCategories);
    const parsedDate = parseIsoDate(scanResult.date ?? toIsoDate(new Date()));

    setTitle(normalizedTitle);
    if (normalizedAmount !== null) {
      setExpression(String(normalizedAmount));
      setHistoryExpression('');
    }
    if (matchedCategoryId !== null) {
      setSelectedCategoryId(matchedCategoryId);
    }
    if (parsedDate) {
      setCustomLoggedAt((prev) => {
        const base = prev ?? new Date();
        const next = new Date(base);
        next.setFullYear(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
        return next;
      });
    }

    if (itemNote && title.trim().length === 0) {
      setTitle(normalizedTitle);
    }

    setAwaitingFreshScanResult(false);
    setScannerVisible(false);
    setActiveField('title');
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }, [scanStatus, scanResult, availableCategories, scannerVisible, awaitingFreshScanResult, title]);

  useEffect(() => {
    if (!awaitingFreshScanResult) return;
    if (scanStatus === 'error' || scanStatus === 'idle') {
      setAwaitingFreshScanResult(false);
    }
  }, [scanStatus, awaitingFreshScanResult]);

  const canSave =
    !submitting &&
    Boolean(selectedWalletId) &&
    Number.isFinite(computedAmount) &&
    computedAmount > 0 &&
    title.trim().length > 0;
  const isExpense = mode === 'expense';
  const modeColor = isExpense ? theme.red : theme.green;

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

  const activateTitleInput = () => {
    setActiveField('title');
    titleInputRef.current?.focus();
  };

  const dismissKeypad = () => {
    if (activeField === 'amount') setActiveField('other');
  };

  const openScanner = () => {
    if (!isExpense) return;
    dismissKeypad();
    Keyboard.dismiss();
    setAwaitingFreshScanResult(false);
    resetScanner();
    setScannerVisible(true);
  };

  const beginCameraScan = async () => {
    resetScanner();
    setAwaitingFreshScanResult(true);
    await scanFromCamera();
  };

  const beginGalleryScan = async () => {
    resetScanner();
    setAwaitingFreshScanResult(true);
    await scanFromGallery();
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
      await onSubmit({
        title: title.trim(),
        amount: computedAmount,
        type: mode,
        walletId: selectedWalletId,
        categoryId: selectedCategoryId,
        loggedAt: customLoggedAt ?? new Date(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetScanner();
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 700,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsClosing(false);
      onClose();
    });
  };


  return (
    <Modal visible={visible || isClosing} transparent animationType="none" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {!scannerVisible ? (
          <Animated.View style={[s.backdrop, { backgroundColor: theme.backdrop, opacity: backdropAnim }]} pointerEvents={isClosing ? 'none' : 'auto'}>
            <Pressable style={s.flex} onPress={handleClose} />
          </Animated.View>
        ) : null}

        {!scannerVisible ? (
        <Animated.View
          style={[
            s.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Drag Indicator */}
          <View style={s.dragHandleWrap}>
            <View style={[s.dragHandle, { backgroundColor: theme.borderHighlight }]} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={dismissKeypad}
            contentContainerStyle={{ paddingBottom: activeField === 'amount' ? 320 + insets.bottom : insets.bottom + 24 }}
          >
            {/* Header */}
            <View style={s.headerRow}>
              <View style={s.headerTitleWrap}>
                <View style={[s.modeDot, { backgroundColor: modeColor }]} />
                <Text style={[s.modalTitle, { color: theme.text }]}>
                  New {isExpense ? 'Expense' : 'Income'}
                </Text>
              </View>
              <Pressable onPress={handleClose} hitSlop={15} style={s.closeButton}>
                <Ionicons name="close" size={24} color={theme.secondary} />
              </Pressable>
            </View>

            {/* Massive Amount Input */}
            <Pressable onPress={activateAmountInput} style={s.amountContainer}>
              <View style={s.amountValueRow}>
                <Text style={[s.currencySymbol, { color: activeField === 'amount' ? theme.text : theme.secondary }]}>
                  {currencySymbol}
                </Text>
                <Text
                  style={[s.amountText, { color: activeField === 'amount' ? theme.text : theme.secondary }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(computedAmount, '')}
                </Text>
              </View>
              {expressionText ? (
                <Text style={[s.expressionText, { color: theme.secondary }]}>
                  {expressionText}
                </Text>
              ) : null}
            </Pressable>

              {isExpense ? (
                <Pressable
                  onPress={openScanner}
                  style={[s.scanTrigger, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                >
                  <View style={[s.scanTriggerIconWrap, { backgroundColor: isDark ? 'rgba(123,228,149,0.14)' : 'rgba(123,228,149,0.16)' }]}> 
                    <Ionicons name="scan-outline" size={16} color={isDark ? theme.lime : theme.limeDark} />
                  </View>
                  <View style={s.scanTriggerTextWrap}>
                    <Text style={[s.scanTriggerTitle, { color: theme.text }]}>Scan receipt</Text>
                    <Text style={[s.scanTriggerSubtitle, { color: theme.secondary }]}>Capture first, then review and edit details.</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.secondary} />
                </Pressable>
              ) : null}

            {/* Title Input */}
            <View style={[s.inputRow, { borderBottomColor: activeField === 'title' ? theme.text : theme.border }]}>
              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={setTitle}
                onFocus={() => setActiveField('title')}
                placeholder={isExpense ? 'e.g. Lunch, Grab' : 'e.g. April Salary, Freelance'}
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
                      onPress={() => { dismissKeypad(); setSelectedWalletId(wallet.id); }}
                      style={[
                        s.walletCard,
                        {
                          backgroundColor: active ? (isDark ? 'rgba(123,228,149,0.10)' : theme.surface) : theme.surfaceAlt,
                          borderColor: active ? theme.limeDark : theme.border,
                        },
                      ]}
                    >
                      <View style={s.walletCardInner}>
                        <View style={[s.walletIconWrap, { backgroundColor: active ? 'rgba(123,228,149,0.18)' : `${theme.secondary}18` }]}> 
                          <Ionicons name="wallet" size={15} color={active ? theme.limeDark : theme.secondary} />
                        </View>
                        <View style={s.walletCardText}>
                          <Text style={[s.walletCardName, { color: active ? theme.text : theme.secondary }]} numberOfLines={1}>
                            {wallet.name}
                          </Text>
                          <Text style={[s.walletCardBalance, { color: active ? theme.secondary : theme.secondary }]}>
                            {currencySymbol}{formatCurrency(wallet.current_balance ?? 0, currencySymbol)}
                          </Text>
                        </View>
                        {active && <Ionicons name="checkmark-circle" size={15} color={theme.limeDark} />}
                      </View>
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
                  dismissKeypad();
                  Keyboard.dismiss();
                  setCategoryDropdownOpen(!categoryDropdownOpen);
                }}
                style={[
                  s.dropdownTrigger,
                  {
                    backgroundColor: categoryDropdownOpen ? (isDark ? 'rgba(123,228,149,0.06)' : theme.surfaceAlt) : theme.surface,
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
                          isActive && { backgroundColor: isDark ? 'rgba(123,228,149,0.06)' : 'rgba(123,228,149,0.10)' }
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

            {/* Logged At */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: theme.secondary }]}>Logged At</Text>
              <View style={[s.loggedAtCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <View style={s.loggedAtRow}>
                  <Text style={[s.loggedAtLabel, { color: theme.text }]}>Date</Text>
                  <DateTimePicker
                    value={customLoggedAt ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={(_: DateTimePickerEvent, selected?: Date) => {
                      dismissKeypad();
                      if (selected) setCustomLoggedAt(prev => {
                        const base = prev ?? new Date();
                        const next = new Date(base);
                        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                        return next;
                      });
                    }}
                    themeVariant={isDark ? 'dark' : 'light'}
                  />
                </View>
                <View style={[s.loggedAtDivider, { backgroundColor: theme.border }]} />
                <View style={s.loggedAtRow}>
                  <Text style={[s.loggedAtLabel, { color: theme.text }]}>Time</Text>
                  <DateTimePicker
                    value={customLoggedAt ?? new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={(_: DateTimePickerEvent, selected?: Date) => {
                      dismissKeypad();
                      if (selected) setCustomLoggedAt(prev => {
                        const base = prev ?? new Date();
                        const next = new Date(base);
                        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                        return next;
                      });
                    }}
                    themeVariant={isDark ? 'dark' : 'light'}
                  />
                </View>
              </View>
            </View>

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
        </Animated.View>
        ) : null}
      </KeyboardAvoidingView>

      {/* Floating custom keypad — slides up like native keyboard */}
      {!scannerVisible ? (
      <Animated.View
        style={[
          s.keypadPanel,
          {
            backgroundColor: theme.keypadBg,
            borderTopColor: theme.borderHighlight,
            paddingBottom: insets.bottom,
            transform: [{ translateY: keypadAnim }],
          },
        ]}
        pointerEvents={activeField === 'amount' ? 'auto' : 'none'}
      >
        {/* Accessory bar */}
        <View style={[s.keypadAccessory, { borderBottomColor: theme.border }]}>
          <Text style={[s.keypadHint, { color: theme.secondary }]} numberOfLines={1}>
            {expressionText || ' '}
          </Text>
          <Pressable onPress={activateTitleInput} style={s.keypadNextBtn} hitSlop={10}>
            <Text style={[s.keypadNextText, { color: theme.limeDark }]}>Next</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.limeDark} />
          </Pressable>
        </View>

        {/* Key grid */}
        <View style={s.keypadGrid}>
          {KEYPAD_ROWS.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={s.keypadRow}>
              {row.map((key) => {
                const isAction = key === '=' || key === '+' || key === '-';
                const isDelete = key === 'DEL' || key === 'CLR';

                let keyColor: string = theme.text;
                let bg: string = theme.keyBg;
                let border: string = theme.keyBorder;

                if (isAction) {
                  keyColor = isDark ? '#0F172A' : '#F7F9FB';
                  bg = theme.text;
                  border = theme.text;
                }
                if (isDelete) {
                  keyColor = theme.red;
                  bg = theme.keyDeleteBg;
                  border = isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.42)';
                }

                return (
                  <TouchableOpacity
                    key={key}
                    accessibilityRole="button"
                    onPress={() => onKeyPress(key)}
                    activeOpacity={0.72}
                    style={[
                      s.keyButton,
                      { backgroundColor: bg, borderColor: border },
                      isDelete && s.keyDeleteButton,
                      isAction && s.keyActionButton,
                      !isAction && !isDelete && s.keyDefaultButton,
                    ]}
                  >
                    <Text style={[s.keyLabel, { color: keyColor }]} numberOfLines={1}>
                      {key === 'DEL' ? '⌫' : key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>
      ) : null}

      {scannerVisible ? (
      <View style={StyleSheet.absoluteFill}>
        <Pressable
          style={[s.scanBackdrop, { backgroundColor: theme.backdrop }]}
          onPress={handleClose}
        />
        <View style={s.scanContainer}>
          <View style={[s.scanCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.scanHeader}>
              <Text style={[s.scanTitle, { color: theme.text }]}>Scan receipt</Text>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color={theme.secondary} />
              </Pressable>
            </View>

            {(scanStatus === 'idle' || scanStatus === 'capturing') && (
              <>
                <Text style={[s.scanBody, { color: theme.secondary }]}>Choose camera or gallery. The image is sent securely to your backend for Gemini parsing, then returned for review.</Text>
                <View style={s.scanActionsRow}>
                  <TouchableOpacity onPress={() => void beginCameraScan()} style={[s.scanActionBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                    <Ionicons name="camera-outline" size={18} color={theme.text} />
                    <Text style={[s.scanActionText, { color: theme.text }]}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => void beginGalleryScan()} style={[s.scanActionBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                    <Ionicons name="images-outline" size={18} color={theme.text} />
                    <Text style={[s.scanActionText, { color: theme.text }]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {scanStatus === 'processing' && (
              <View style={s.scanProcessingWrap}>
                <ActivityIndicator size="large" color={theme.limeDark} />
                <Text style={[s.scanProcessingTitle, { color: theme.text }]}>Parsing receipt...</Text>
                <Text style={[s.scanBody, { color: theme.secondary }]}>Please wait while the backend extracts details.</Text>
                {scanImageUri ? (
                  <Image source={{ uri: scanImageUri }} style={[s.scanPreview, { borderColor: theme.border }]} resizeMode="cover" />
                ) : null}
              </View>
            )}

            {scanStatus === 'error' && (
              <View style={s.scanProcessingWrap}>
                <Ionicons name="alert-circle-outline" size={34} color={theme.red} />
                <Text style={[s.scanProcessingTitle, { color: theme.text }]}>Could not read receipt</Text>
                <Text style={[s.scanBody, { color: theme.secondary }]}>{scanError ?? 'Try another image.'}</Text>
                <TouchableOpacity
                  onPress={resetScanner}
                  style={[s.scanRetryBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                >
                  <Text style={[s.scanRetryText, { color: theme.text }]}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
      ) : null}

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
    paddingBottom: 0,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  amountValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  expressionText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  scanTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 58,
    marginBottom: 14,
    gap: 10,
  },
  scanTriggerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTriggerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  scanTriggerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  scanTriggerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
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
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
  },
  walletCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCardText: {
    flex: 1,
    minWidth: 0,
  },
  walletCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  walletCardBalance: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
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
  // Logged At
  loggedAtCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  loggedAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  loggedAtLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  loggedAtDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
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

  // Floating keypad panel
  keypadPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingTop: 0,
  },
  keypadAccessory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  keypadHint: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  keypadNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  keypadNextText: {
    fontSize: 15,
    fontWeight: '700',
  },
  keypadGrid: {
    gap: 8,
    paddingBottom: 6,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  keyActionButton: {
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
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
  keyLabel: {
    fontSize: 22,
    fontWeight: '700',
  },

  scanBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  scanCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scanBody: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  scanActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  scanActionBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scanActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scanProcessingWrap: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  scanProcessingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scanPreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  scanRetryBtn: {
    marginTop: 6,
    height: 44,
    minWidth: 120,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  scanRetryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Actions
  footerActions: {
    marginTop: 8,
    marginBottom: 8,
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
    backgroundColor: 'rgba(239,68,68,0.12)',
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