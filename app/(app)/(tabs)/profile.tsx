import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearanceModeSelector } from '@/components/Base/AppearanceModeSelector';
import { ProfileMenuCard } from '@/components/Profile/ProfileMenuCard';
import { WalletPreviewSection } from '@/components/Profile/WalletPreviewSection';
import { radius, spacing, typeScale } from '@/constants/designSystem';
import { useAuth } from '@/context/AuthContext';
import { useAppPreferences } from '@/context/AppPreferencesContext';
import { useFinanceSelectors } from '@/hooks/useFinanceSelectors';

type ManageCard = {
  title: string;
  description: string;
  route:
    | '/profile/manage-categories'
    | '/profile/manage-budgets'
    | '/profile/manage-goals'
    | '/profile/manage-debt'
    | '/profile/manage-money-owed-to-you';
  icon: keyof typeof Ionicons.glyphMap;
  iconBackground?: string;
  iconColor?: string;
};

export default function ProfileScreen() {
  const { signOut, profile } = useAuth();
  const theme = useTheme();
  const { isDark } = theme;
  const router = useRouter();
  const finance = useFinanceSelectors();
  const { notifications, setNotificationPreference } = useAppPreferences();
  const softLimeIconBg = isDark ? theme.surfaceDeep : 'rgba(200,245,96,0.20)';

  const manageCards: ManageCard[] = [
    {
      title: 'Categories',
      description: 'Customize expense and income categories.',
      route: '/profile/manage-categories',
      icon: 'grid-outline',
      iconBackground: softLimeIconBg,
    },
    {
      title: 'Category Budgeting',
      description: 'Set daily, weekly, monthly, or annual spending limits by category.',
      route: '/profile/manage-budgets',
      icon: 'pie-chart-outline',
      iconBackground: softLimeIconBg,
      iconColor: theme.limeDark,
    },
    {
      title: 'Goals',
      description: 'Create personal savings targets and monitor your progress.',
      route: '/profile/manage-goals',
      icon: 'flag-outline',
      iconBackground: softLimeIconBg,
    },
    {
      title: 'Debt',
      description: 'Track debts you owe with due dates and payment progress.',
      route: '/profile/manage-debt',
      icon: 'document-text-outline',
      iconBackground: softLimeIconBg,
      iconColor: theme.red,
    },
    {
      title: 'Money Owed To You',
      description: 'Track collections and expected dates from people who owe you.',
      route: '/profile/manage-money-owed-to-you',
      icon: 'cash-outline',
      iconBackground: softLimeIconBg,
      iconColor: theme.green,
    },
  ];

  const initials = profile?.full_name
    ? profile.full_name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <Text style={[s.screenTitle, { color: theme.text }]}>
          Settings
        </Text>

        <ProfileMenuCard
          title={profile?.full_name ?? 'Account'}
          description={profile?.email ?? ''}
          icon={initials ? 'person' : 'person-outline'}
          iconLabel={initials ?? undefined}
          largeIcon
          onPress={() => router.push('/profile/profile-details')}
          iconBackground={softLimeIconBg}
          iconColor={isDark ? theme.lime : theme.limeDark}
        />

        <Text style={[s.sectionLabel, { color: theme.secondary }]}>WALLETS</Text>

        <WalletPreviewSection wallets={finance.wallets} formatCurrency={finance.formatCurrency} />

        <ProfileMenuCard
          title="Manage Wallets"
          description="Open wallet settings and add new wallet accounts."
          icon="wallet-outline"
          iconBackground={softLimeIconBg}
          onPress={() => router.push('/profile/manage-wallets')}
        />

        <Text style={[s.sectionLabel, s.manageLabel, { color: theme.secondary }]}>MANAGE</Text>

        {manageCards.map((card) => (
          <ProfileMenuCard
            key={card.title}
            title={card.title}
            description={card.description}
            icon={card.icon}
            iconBackground={card.iconBackground}
            iconColor={card.iconColor}
            topMargin={spacing.sm + 2}
            onPress={() => router.push(card.route)}
          />
        ))}

        <Text style={[s.sectionLabel, s.manageLabel, { color: theme.secondary }]}>NOTIFICATIONS</Text>

        <View style={[s.notifCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {([
            { key: 'budgetAlerts', label: 'Budget Alerts', desc: 'Warn when budgets reach 80% or are exceeded' },
            { key: 'largeExpenseWarnings', label: 'Large Expense Warnings', desc: 'Flag single expenses over 15% of total balance' },
            { key: 'goalMilestones', label: 'Goal Milestones', desc: 'Notify at 25%, 50%, 75% and deadline proximity' },
            { key: 'weeklyReport', label: 'Weekly Activity Nudge', desc: 'Alert if no transactions have been logged this week' },
            { key: 'dailySummary', label: 'Daily Summary', desc: 'Daily spending recap (coming soon)' },
          ] as const).map((item, index, arr) => (
            <View
              key={item.key}
              style={[
                s.notifRow,
                index < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
            >
              <View style={s.notifText}>
                <Text style={[s.notifLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={[s.notifDesc, { color: theme.secondary }]}>{item.desc}</Text>
              </View>
              <Switch
                value={notifications[item.key]}
                onValueChange={(v) => setNotificationPreference(item.key, v)}
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

        <View style={s.appearanceBlock}>
          <AppearanceModeSelector />
        </View>

        <TouchableOpacity
          onPress={signOut}
          activeOpacity={0.7}
          style={[s.signOutButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.red} style={s.signOutIcon} />
          <Text style={[s.signOutText, { color: theme.red }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xs,
  },
  screenTitle: {
    fontSize: typeScale.title + 6,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: spacing.lg + 4,
  },
  sectionLabel: {
    fontSize: typeScale.caption,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  manageLabel: {
    marginTop: spacing.xxl,
  },
  appearanceBlock: {
    marginTop: spacing.xxl,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: radius.lg,
    height: 56,
    marginTop: spacing.lg + 4,
    borderWidth: 1,
  },
  notifCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  notifText: {
    flex: 1,
  },
  notifLabel: {
    fontSize: typeScale.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  notifDesc: {
    fontSize: typeScale.bodySm,
    fontWeight: '500',
    lineHeight: 17,
  },
  signOutIcon: {
    marginRight: spacing.sm,
  },
  signOutText: {
    fontSize: typeScale.bodyLg,
    fontWeight: '700',
  },
});
