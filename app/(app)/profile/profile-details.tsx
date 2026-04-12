import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

function InfoRow({ icon, label, value, isDark, theme }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | null | undefined;
  isDark: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      className="rounded-2xl border"
      style={{ backgroundColor: theme.surface, borderColor: theme.border, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10 }}
    >
      <View className="flex-row items-center">
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: isDark ? theme.surfaceDeep : 'rgba(155,194,58,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name={icon} size={18} color={isDark ? theme.lime : theme.limeDark} />
        </View>
        <View className="flex-1">
          <Text style={{ color: theme.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 }}>
            {label}
          </Text>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
            {value ?? '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ProfileDetailsScreen() {
  const { profile } = useAuth();
  const theme = useTheme();
  const { isDark } = theme;

  const initials = profile?.full_name
    ? profile.full_name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 28 }}>
        {/* Avatar */}
        <View className="items-center mb-8">
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              backgroundColor: isDark ? theme.surfaceDeep : 'rgba(155,194,58,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            {initials ? (
              <Text style={{ color: isDark ? theme.lime : theme.limeDark, fontSize: 32, fontWeight: '800' }}>
                {initials}
              </Text>
            ) : (
              <Ionicons name="person-outline" size={40} color={isDark ? theme.lime : theme.limeDark} />
            )}
          </View>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>
            {profile?.full_name ?? 'Account'}
          </Text>
        </View>

        <Text className="text-[11px] font-extrabold tracking-[2px] mb-3" style={{ color: theme.secondary }}>
          ACCOUNT DETAILS
        </Text>

        <InfoRow icon="person-outline" label="Full Name" value={profile?.full_name} isDark={isDark} theme={theme} />
        <InfoRow icon="mail-outline" label="Email" value={profile?.email} isDark={isDark} theme={theme} />
        <InfoRow icon="cash-outline" label="Currency" value={profile?.currency} isDark={isDark} theme={theme} />
      </ScrollView>
    </SafeAreaView>
  );
}
