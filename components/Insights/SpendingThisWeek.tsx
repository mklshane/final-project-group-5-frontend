import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type BarData = {
  label: string;
  total: number;
};

type SpendingThisWeekProps = {
  barData: BarData[];
  maxBar: number;
  todayDayIndex: number;
};

export default function SpendingThisWeek({ barData, maxBar, todayDayIndex }: SpendingThisWeekProps) {
  const theme = useTheme();
  const s = makeStyles(theme);

  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>SPENDING THIS WEEK</Text>
      <View style={s.barChart}>
        {barData.map((bar, i) => {
          const heightPct = bar.total / maxBar;
          const isToday = i === todayDayIndex;
          return (
            <View key={bar.label} style={s.barCol}>
              <View style={s.barTrack}>
                <View
                  style={[
                    s.barFill,
                    {
                      height: `${Math.max(heightPct * 100, bar.total > 0 ? 8 : 0)}%`,
                      backgroundColor: isToday ? theme.lime : (theme.isDark ? '#2C3122' : '#DDE1CF'),
                    },
                  ]}
                />
              </View>
              <Text style={[s.barDayLabel, isToday && { color: theme.lime, fontWeight: '700' }]}>
                {bar.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  card: { backgroundColor: theme.surface, borderRadius: 20, padding: 16, gap: 12 },
  cardLabel: { fontSize: 9, fontWeight: '800', color: theme.secondary, letterSpacing: 1.4 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', gap: 5 },
  barTrack: {
    flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,30,20,0.06)',
  },
  barFill: { width: '100%', borderRadius: 6 },
  barDayLabel: { fontSize: 9, fontWeight: '600', color: theme.secondary },
});
