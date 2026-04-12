import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { WalletRow } from '@/components/Profile/WalletRow';
import { useTheme } from '@/hooks/useTheme';
import type { WalletRecord, WalletType } from '@/types/finance';

const SECTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  GENERAL: 'wallet-outline',
  BANK: 'business-outline',
  'E-WALLET': 'phone-portrait-outline',
  CASH: 'cash-outline',
};

interface WalletListSectionProps {
  title: string;
  titleColor: string;
  wallets: Array<WalletRecord & { typeLabel?: string }>;
  emptyText: string;
  formatCurrency: (value: number) => string;
  onEdit: (wallet: WalletRecord) => void;
  onArchive: (wallet: WalletRecord) => void;
}

export function WalletListSection({
  title,
  titleColor,
  wallets,
  emptyText,
  formatCurrency,
  onEdit,
  onArchive,
}: WalletListSectionProps) {
  const theme = useTheme();
  const emptyIcon = SECTION_ICONS[title] ?? 'wallet-outline';

  return (
    <View style={s.section}>
      <Text style={[s.title, { color: titleColor }]}>{title}</Text>

      {wallets.length === 0 ? (
        <View style={[s.emptyCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <View style={[s.emptyIconWrap, { backgroundColor: theme.surfaceDeep }]}>
            <Ionicons name={emptyIcon} size={16} color={theme.tertiary} />
          </View>
          <Text style={[s.emptyText, { color: theme.tertiary }]}>{emptyText}</Text>
        </View>
      ) : (
        <View style={s.list}>
          {wallets.map((wallet) => (
            <WalletRow
              key={wallet.id}
              wallet={wallet}
              amountLabel={formatCurrency(wallet.current_balance)}
              onEdit={onEdit}
              onArchive={onArchive}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  list: {
    gap: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    borderStyle: 'dashed',
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
