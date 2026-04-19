import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typeScale } from '@/constants/designSystem';
import { useTheme } from '@/hooks/useTheme';

type ProfileMenuCardProps = {
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconLabel?: string;
  iconColor?: string;
  iconBackground?: string;
  onPress: () => void;
  largeIcon?: boolean;
  trailing?: React.ReactNode;
  topMargin?: number;
};

export function ProfileMenuCard({
  title,
  description,
  icon,
  iconLabel,
  iconColor,
  iconBackground,
  onPress,
  largeIcon = false,
  trailing,
  topMargin = 0,
}: ProfileMenuCardProps) {
  const theme = useTheme();

  const iconWrapSize = largeIcon ? 46 : 34;
  const iconSize = largeIcon ? 22 : 18;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.surfaceDeep }}
      style={s.pressable}
    >
      {({ pressed }) => (
        <View
          style={[
            s.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              marginTop: topMargin,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.995 : 1 }],
            },
          ]}
        >
          <View style={s.row}>
            <View
              style={[
                s.iconWrap,
                {
                  width: iconWrapSize,
                  height: iconWrapSize,
                  borderRadius: largeIcon ? 23 : radius.sm,
                  marginRight: largeIcon ? spacing.md : spacing.sm + 2,
                  backgroundColor: iconBackground ?? (theme.isDark ? theme.surfaceDeep : 'rgba(123,228,149,0.16)'),
                },
              ]}
            >
              {iconLabel ? (
                <Text style={[s.iconLabel, { color: iconColor ?? (theme.isDark ? theme.lime : theme.limeDark), fontSize: largeIcon ? 17 : 13 }]}> 
                  {iconLabel}
                </Text>
              ) : (
                <Ionicons name={icon} size={iconSize} color={iconColor ?? (theme.isDark ? theme.lime : theme.limeDark)} />
              )}
            </View>

            <View style={s.content}>
              <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>
                {title}
              </Text>
              {description ? (
                <Text style={[s.description, { color: theme.secondary }]} numberOfLines={2}>
                  {description}
                </Text>
              ) : null}
            </View>

            {trailing ?? <Ionicons name="chevron-forward" size={18} color={theme.isDark ? theme.secondary : theme.text} />}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: typeScale.body,
    fontWeight: '800',
  },
  description: {
    fontSize: typeScale.bodySm,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 17,
  },
});
