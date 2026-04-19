import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { WALLET_TYPE_ICONS } from '@/constants/defaultWallets';
import type { WalletRecord } from '@/types/finance';
import { useTheme } from '@/hooks/useTheme';

interface WalletRowProps {
  wallet: WalletRecord & { typeLabel?: string };
  amountLabel: string;
  onEdit: (wallet: WalletRecord) => void;
  onArchive: (wallet: WalletRecord) => void;
}

export function WalletRow({ wallet, amountLabel, onEdit, onArchive }: WalletRowProps) {
  const theme = useTheme();
  const { isDark } = theme;

  const icon = WALLET_TYPE_ICONS[wallet.type] as keyof typeof Ionicons.glyphMap;
  const defaultBg = isDark ? 'rgba(200,245,96,0.18)' : 'rgba(200,245,96,0.28)';
  const defaultText = isDark ? '#C8F560' : '#6E8F1A';
  const iconBg = isDark ? 'rgba(200,245,96,0.14)' : 'rgba(200,245,96,0.20)';
  const iconColor = isDark ? theme.lime : theme.limeDark;
  const metaLabel = wallet.institution_name
    ? `${wallet.typeLabel ?? wallet.type} • ${wallet.institution_name}`
    : wallet.typeLabel ?? wallet.type;

  const openWalletMenu = () => {
    Alert.alert(wallet.name, 'Choose an action', [
      { text: 'Edit Wallet', onPress: () => onEdit(wallet) },
      { text: 'Archive Wallet', style: 'destructive', onPress: () => onArchive(wallet) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={[s.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        onPress={openWalletMenu}
        style={s.menuButton}
        accessibilityLabel={`Open options for ${wallet.name}`}
        hitSlop={10}
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={theme.secondary} />
      </Pressable>

      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      <View style={s.info}>
        <View style={s.topLine}>
          <View style={s.nameGroup}>
            <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>
              {wallet.name}
            </Text>
            {wallet.is_default ? (
              <View style={[s.defaultChip, { backgroundColor: defaultBg }]}> 
                <Text style={[s.defaultLabel, { color: defaultText }]}>DEFAULT</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={[s.meta, { color: theme.secondary }]} numberOfLines={1}>{metaLabel}</Text>
      </View>

      <View style={s.amountWrap}>
        <Text style={[s.amount, { color: theme.text }]}>{amountLabel}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    flexShrink: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    maxWidth: 125,
  },
  meta: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  defaultChip: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  defaultLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'right',
  },
  amountWrap: {
    minWidth: 96,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingTop: 18,
    paddingRight: 2,
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
