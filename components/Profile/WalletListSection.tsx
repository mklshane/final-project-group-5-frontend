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
  emptyDescription?: string;
  formatCurrency: (value: number) => string;
  onEdit: (wallet: WalletRecord) => void;
  onArchive: (wallet: WalletRecord) => void;
}

export function WalletListSection({
  title,
  titleColor,
  wallets,
  emptyText,
  emptyDescription,
  formatCurrency,
  onEdit,
  onArchive,
}: WalletListSectionProps) {
  const theme = useTheme();
  const emptyIcon = SECTION_ICONS[title] ?? 'wallet-outline';

  return (
    <View style={s.section}>
      <View style={s.headerRow}>
        <Text style={[s.title, { color: titleColor }]}>{title}</Text>
      </View>

      {wallets.length === 0 ? (
        <View style={[s.emptyCard, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
          <View style={[s.emptyIconWrap, { backgroundColor: theme.surface }]}> 
            <Ionicons name={emptyIcon} size={20} color={theme.isDark ? theme.lime : theme.limeDark} />
          </View>
          <View style={s.emptyCopy}>
            <Text style={[s.emptyText, { color: theme.text }]}>{emptyText}</Text>
            {emptyDescription ? <Text style={[s.emptySubText, { color: theme.secondary }]}>{emptyDescription}</Text> : null}
          </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    flex: 1,
  },
  list: {
    gap: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  emptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    gap: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptySubText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});
