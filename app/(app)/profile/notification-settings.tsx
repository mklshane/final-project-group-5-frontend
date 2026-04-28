import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProfileMenuCard } from '@/components/Profile/ProfileMenuCard';
import { radius, spacing, typeScale } from '@/constants/designSystem';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import { useTheme } from '@/hooks/useTheme';

const NOTIFICATION_OPTIONS = [
  {
    key: 'inAppAlerts',
    label: 'In-App Toast Alerts',
    desc: 'Show success, error, and info banners at the top of the app for about 3 seconds.',
  },
  {
    key: 'budgetAlerts',
    label: 'Budget Alerts',
    desc: 'Warn when budgets reach 80% or are exceeded.',
  },
  {
    key: 'largeExpenseWarnings',
    label: 'Large Expense Warnings',
    desc: 'Flag a single expense that is over 15% of your total balance.',
  },
  {
    key: 'goalMilestones',
    label: 'Goal Milestones',
    desc: 'Notify when goals hit 25%, 50%, 75%, or reach the deadline.',
  },
  {
    key: 'weeklyReport',
    label: 'Weekly Activity Nudge',
    desc: 'Send a reminder when no transactions have been logged this week.',
  },
  {
    key: 'dailySummary',
    label: 'Daily Summary',
    desc: 'Send a daily check-in reminder to log and review spending.',
  },
] as const;

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { notifications, setNotificationPreference } = useAppPreferences();

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: theme.text }]}>Notification Settings</Text>
          <Text style={[s.subtitle, { color: theme.secondary }]}>
            Choose which alerts appear in-app and which reminders Budgy keeps sending to you.
          </Text>
        </View>

        <ProfileMenuCard
          title="Open Notification Inbox"
          description="Review recent success messages, warnings, reminders, and past alerts."
          icon="mail-unread-outline"
          iconBackground={theme.isDark ? theme.surfaceDeep : 'rgba(200,245,96,0.20)'}
          onPress={() => router.push('/notifications')}
        />

        <Text style={[s.sectionLabel, { color: theme.secondary }]}>PREFERENCES</Text>

        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {NOTIFICATION_OPTIONS.map((item, index) => (
            <View
              key={item.key}
              style={[
                s.row,
                index < NOTIFICATION_OPTIONS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View style={s.textWrap}>
                <Text style={[s.label, { color: theme.text }]}>{item.label}</Text>
                <Text style={[s.desc, { color: theme.secondary }]}>{item.desc}</Text>
              </View>
              <Switch
                value={notifications[item.key]}
                onValueChange={(value) => setNotificationPreference(item.key, value)}
                trackColor={{
                  false: theme.border,
                  true: theme.isDark ? theme.lime : '#3F7D36',
                }}
                thumbColor={
                  notifications[item.key]
                    ? theme.isDark ? '#1A1E14' : '#FFFFFF'
                    : theme.secondary
                }
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typeScale.title + 4,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typeScale.bodySm,
    fontWeight: '500',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: typeScale.caption,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: typeScale.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  desc: {
    fontSize: typeScale.bodySm,
    fontWeight: '500',
    lineHeight: 17,
  },
});
