import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getAIInsights, FinanceSummary } from '@/lib/gemini';

interface Props {
  summary: FinanceSummary;
}

export default function AIInsightsCard({ summary }: Props) {
  const theme = useTheme();
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setInsights(null);
    try {
      const result = await getAIInsights(summary);
      setInsights(result);
    } catch {
      setError('Could not load AI insights. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const insightLines = insights
    ? insights.split('\n').filter((line) => line.trim().length > 0)
    : [];

  const s = makeStyles(theme);

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="sparkles" size={14} color={theme.lime} />
          <Text style={s.sectionLabel}>AI INSIGHTS</Text>
        </View>
        {!loading && (
          <Pressable onPress={handleGenerate} style={s.analyzeBtn}>
            <Ionicons
              name={insights ? 'refresh' : 'play-circle-outline'}
              size={16}
              color={theme.lime}
            />
            <Text style={s.analyzeBtnText}>{insights ? 'Refresh' : 'Analyze'}</Text>
          </Pressable>
        )}
      </View>

      {!insights && !loading && !error && (
        <Text style={s.placeholder}>
          Tap Analyze to get personalized tips based on your spending this period.
        </Text>
      )}

      {loading && (
        <View style={s.loadingRow}>
          <ActivityIndicator color={theme.lime} size="small" />
          <Text style={s.loadingText}>Analyzing your finances...</Text>
        </View>
      )}

      {error != null && <Text style={s.errorText}>{error}</Text>}

      {insightLines.length > 0 && (
        <View style={s.insightList}>
          {insightLines.map((line, i) => (
            <View key={i} style={s.insightRow}>
              <Text style={s.bullet}>•</Text>
              <Text style={s.insightText}>{line}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 16,
      gap: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.secondary,
      letterSpacing: 1.4,
    },
    analyzeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    analyzeBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.lime,
    },
    placeholder: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.secondary,
      lineHeight: 20,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    loadingText: {
      fontSize: 12,
      color: theme.secondary,
      fontWeight: '500',
    },
    errorText: {
      fontSize: 13,
      color: theme.red,
      fontWeight: '500',
    },
    insightList: {
      gap: 10,
    },
    insightRow: {
      flexDirection: 'row',
      gap: 8,
    },
    bullet: {
      fontSize: 13,
      color: theme.lime,
      marginTop: 1,
    },
    insightText: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      lineHeight: 20,
      fontWeight: '500',
    },
  });
}
