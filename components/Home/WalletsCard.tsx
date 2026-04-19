import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WALLET_TYPE_ICONS } from '@/constants/defaultWallets';
import { useTheme } from '@/hooks/useTheme';

type WalletLike = {
  id: string;
  name: string;
  current_balance: number;
  type: string;
};

type WalletsCardProps = {
  wallet: WalletLike;
  formatCurrency: (amount: number) => string;
  index: number;
};

type Palette = {
  cardBg: string;
  border: string;
  iconBg: string;
  amount: string;
  label: string;
  accent: string;
};

function getPalette(index: number, isDark: boolean): Palette {
  const light: Palette[] = [
    {
      cardBg: '#EFF8E8',
      border: '#D7E8C6',
      iconBg: 'rgba(141, 180, 59, 0.16)',
      amount: '#192616',
      label: '#53614D',
      accent: '#8CB33D',
    },
    {
      cardBg: '#F7F3E8',
      border: '#E8DAC0',
      iconBg: 'rgba(193, 144, 68, 0.16)',
      amount: '#2B2218',
      label: '#6B5E49',
      accent: '#C79044',
    },
    {
      cardBg: '#EEF4EB',
      border: '#D5E2D1',
      iconBg: 'rgba(88, 139, 99, 0.16)',
      amount: '#1C271E',
      label: '#56635A',
      accent: '#5A8C65',
    },
  ];

  const dark: Palette[] = [
    {
      cardBg: '#1F2E22',
      border: '#364C3A',
      iconBg: 'rgba(200, 245, 96, 0.15)',
      amount: '#E7F0DF',
      label: '#A6B4A5',
      accent: '#C8F560',
    },
    {
      cardBg: '#2A271F',
      border: '#474235',
      iconBg: 'rgba(220, 173, 99, 0.15)',
      amount: '#F3EADF',
      label: '#B8AA98',
      accent: '#E0AD63',
    },
    {
      cardBg: '#1F2A23',
      border: '#35443A',
      iconBg: 'rgba(116, 188, 132, 0.15)',
      amount: '#E2EFE4',
      label: '#9DB2A1',
      accent: '#74BC84',
    },
  ];

  const palettes = isDark ? dark : light;
  return palettes[index % palettes.length];
}

export function WalletsCard({ wallet, formatCurrency, index }: WalletsCardProps) {
  const theme = useTheme();
  const palette = getPalette(index, theme.isDark);
  const iconName =
    WALLET_TYPE_ICONS[wallet.type as keyof typeof WALLET_TYPE_ICONS] ??
    'wallet-outline';

  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.border,
          shadowColor: theme.isDark ? '#000' : palette.accent,
        },
      ]}
    >
      <View style={[s.orb, { backgroundColor: `${palette.accent}22` }]} />
      <View style={s.topRow}>
        <View style={[s.iconWrap, { backgroundColor: palette.iconBg }]}>
          <Ionicons
            name={iconName as keyof typeof Ionicons.glyphMap}
            size={16}
            color={palette.accent}
          />
        </View>
        <Text style={[s.typeLabel, { color: palette.label }]} numberOfLines={1}>
          {wallet.type.toUpperCase()}
        </Text>
      </View>

      <Text style={[s.amount, { color: palette.amount }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(wallet.current_balance)}
      </Text>

      <Text style={[s.name, { color: palette.label }]} numberOfLines={1}>
        {wallet.name}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: 164,
    minHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  orb: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    right: -26,
    top: -24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.45,
    marginBottom: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
  },
});
