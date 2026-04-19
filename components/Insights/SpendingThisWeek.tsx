import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

type TrendPoint = {
  label: string;
  total: number;
};

type SpendingThisWeekProps = {
  title: string;
  points: TrendPoint[];
  maxValue: number;
  highlightIndex: number;
};

export default function SpendingThisWeek({ title, points, maxValue, highlightIndex }: SpendingThisWeekProps) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = 104;
  const chartPaddingX = 12;
  const chartPaddingY = 10;
  const usableMax = Math.max(maxValue, 1);
  const activeIndex = highlightIndex >= 0 && highlightIndex < points.length ? highlightIndex : -1;

  const graph = useMemo(() => {
    const width = Math.max(chartWidth, 1);
    const plotWidth = Math.max(width - chartPaddingX * 2, 1);
    const plotHeight = Math.max(chartHeight - chartPaddingY * 2, 1);
    const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;

    const coords = points.map((point, i) => {
      const x = points.length > 1 ? chartPaddingX + i * step : width / 2;
      const y = chartPaddingY + (1 - point.total / usableMax) * plotHeight;
      return { ...point, x, y, isHighlighted: i === activeIndex };
    });

    if (coords.length === 0) {
      return {
        width,
        linePath: '',
        areaPath: '',
        coords,
        guideX: null as number | null,
      };
    }

    const linePath = coords
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    const first = coords[0];
    const last = coords[coords.length - 1];
    const bottomY = chartHeight - chartPaddingY;
    const areaPath = `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;

    return {
      width,
      linePath,
      areaPath,
      coords,
      guideX: activeIndex >= 0 ? coords[activeIndex]?.x ?? null : null,
    };
  }, [activeIndex, chartHeight, chartPaddingX, chartPaddingY, chartWidth, points, usableMax]);

  function handleChartLayout(e: LayoutChangeEvent) {
    const nextWidth = Math.round(e.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== chartWidth) {
      setChartWidth(nextWidth);
    }
  }

  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{title}</Text>
      <View style={s.chartWrap}>
        <View style={[s.plotArea, { height: chartHeight }]} onLayout={handleChartLayout}>
          {[0, 1, 2, 3].map((row) => (
            <View
              key={`grid-${row}`}
              style={[
                s.gridLine,
                {
                  top: (chartHeight / 3) * row,
                  borderColor: theme.isDark ? 'rgba(233,239,228,0.08)' : 'rgba(26,43,35,0.08)',
                },
              ]}
            />
          ))}

          {chartWidth > 0 ? (
            <Svg width={graph.width} height={chartHeight} style={s.svgLayer}>
              <Defs>
                <LinearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={theme.lime} stopOpacity={theme.isDark ? 0.24 : 0.2} />
                  <Stop offset="1" stopColor={theme.lime} stopOpacity={0.02} />
                </LinearGradient>
              </Defs>

              {graph.guideX !== null ? (
                <Line
                  x1={graph.guideX}
                  y1={chartPaddingY}
                  x2={graph.guideX}
                  y2={chartHeight - chartPaddingY}
                  stroke={theme.isDark ? 'rgba(200,245,96,0.2)' : 'rgba(138,175,45,0.22)'}
                  strokeWidth={1}
                />
              ) : null}

              {graph.areaPath ? <Path d={graph.areaPath} fill="url(#trendAreaGradient)" /> : null}
              {graph.linePath ? (
                <Path
                  d={graph.linePath}
                  fill="none"
                  stroke={theme.isDark ? theme.lime : theme.limeDark}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}

              {graph.coords.map((point, i) => (
                <Circle
                  key={`${point.label}-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r={point.isHighlighted ? 4.8 : 3.6}
                  fill={point.isHighlighted ? theme.lime : theme.surface}
                  stroke={point.isHighlighted ? theme.limeDark : theme.border}
                  strokeWidth={point.isHighlighted ? 2 : 1.2}
                />
              ))}
            </Svg>
          ) : null}
        </View>

        <View style={s.labelsRow}>
          {graph.coords.map((point, i) => (
            <View key={`${point.label}-label-${i}`} style={s.labelCell}>
              <Text style={[s.barDayLabel, point.isHighlighted && { color: theme.limeDark, fontWeight: '800' }]} numberOfLines={1}>
                {point.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: theme.isDark ? 0 : 0.05,
    shadowRadius: 8,
    elevation: theme.isDark ? 0 : 2,
  },
  cardLabel: { fontSize: 9, fontWeight: '800', color: theme.secondary, letterSpacing: 1.4 },
  chartWrap: {
    gap: 8,
  },
  plotArea: {
    borderRadius: 12,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(26,43,35,0.03)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  svgLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelCell: {
    flex: 1,
    alignItems: 'center',
  },
  barDayLabel: { fontSize: 9, fontWeight: '600', color: theme.secondary },
});
