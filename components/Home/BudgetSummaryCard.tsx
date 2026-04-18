import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface BudgetSummaryCardProps {
  title: string;
  icon: string;
  color: string;
  periodLabel: string;
  spentLabel: string;
  limitLabel: string;
  statusText: string;
  percentage: number;
  overLimit: boolean;
  onPress: () => void;
}

export function BudgetSummaryCard({
  title,
  icon,
  color,
  periodLabel,
  spentLabel,
  limitLabel,
  statusText,
  percentage,
  overLimit,
  onPress,
}: BudgetSummaryCardProps) {
  const theme = useTheme();

  const iconName =
    icon && Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, icon)
      ? (icon as keyof typeof Ionicons.glyphMap)
      : 'apps-outline';

  const safePercentage = Math.max(0, Math.min(percentage, 999));
  const accentColor = overLimit ? theme.red : (theme.isDark ? theme.lime : '#3F7D36');
  const subtitleText = `${periodLabel} • ${statusText}`;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.94 : 1 }]}> 
          <View style={s.topRow}>
            <View style={[s.iconWrap, { backgroundColor: `${color}1A` }]}> 
              <Ionicons name={iconName} size={18} color={color} />
            </View>

            <View style={s.info}>
              <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
              <Text style={[s.subtitle, { color: theme.tertiary }]} numberOfLines={1}>{subtitleText}</Text>
            </View>

            <Text style={[s.amount, { color: overLimit ? theme.red : accentColor }]}>
              {safePercentage}%
            </Text>
          </View>

          <View style={s.progressContainer}>
            <View style={[s.progressTrack, { backgroundColor: theme.surfaceDeep }]}> 
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${Math.min(safePercentage, 100)}%`,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>

            <View style={s.progressLabelRow}>
              <Text style={[s.progressLabel, { color: theme.tertiary }]}>
                {spentLabel} spent
              </Text>
              <Text style={[s.progressLabel, { color: theme.tertiary }]}>
                of {limitLabel}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  progressContainer: {
    width: '100%',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
