import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export interface SmartInsight {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  boldText: string;
  bodyText: string;
}

interface Props {
  insights: SmartInsight[];
}

export default function SmartInsightsSection({ insights }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);

  if (insights.length === 0) return null;

  return (
    <View style={s.wrapper}>
      <Text style={s.sectionLabel}>SMART INSIGHTS</Text>
      <View style={s.list}>
        {insights.map((item, i) => (
          <View key={i} style={s.card}>
            <View style={[s.iconWrap, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={18} color={item.iconColor} />
            </View>
            <Text style={s.body} numberOfLines={3}>
              <Text style={s.bold}>{item.boldText} </Text>
              {item.bodyText}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    wrapper: {
      gap: 10,
    },
    sectionLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.secondary,
      letterSpacing: 1.4,
    },
    list: {
      gap: 8,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    body: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      lineHeight: 19,
    },
    bold: {
      fontWeight: '700',
    },
  });
}
