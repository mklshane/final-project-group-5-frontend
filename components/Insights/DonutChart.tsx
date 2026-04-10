import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface DonutSlice {
  label: string;
  percentage: number;
  color: string;
}

interface Props {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
}

interface SliceProps {
  startAngle: number;
  sweepAngle: number;
  color: string;
  size: number;
}

function DonutSlice({ startAngle, sweepAngle, color, size }: SliceProps) {
  const r = size / 2;

  // Renders a right-half disc, clipped by overflow:hidden.
  // outerRotation places the start of the arc, discRotation limits the sweep.
  const renderHalf = (outerRotation: number, discRotation: number) => (
    <View
      style={[
        StyleSheet.absoluteFill,
        { transform: [{ rotate: `${outerRotation - 90}deg` }] },
      ]}
    >
      {/* Clip to right half only */}
      <View
        style={{
          position: 'absolute',
          left: r,
          width: r,
          height: size,
          overflow: 'hidden',
        }}
      >
        {/* Full colored circle — rotated to limit visible sweep */}
        <View
          style={{
            position: 'absolute',
            right: 0,
            width: size,
            height: size,
            borderRadius: r,
            backgroundColor: color,
            transform: [{ rotate: `${discRotation}deg` }],
          }}
        />
      </View>
    </View>
  );

  if (sweepAngle <= 180) {
    return renderHalf(startAngle, sweepAngle - 180);
  }

  // sweepAngle > 180: full right half + partial second half
  return (
    <>
      {renderHalf(startAngle, 0)}
      {renderHalf(startAngle + 180, sweepAngle - 360)}
    </>
  );
}

export default function DonutChart({ data, size = 140, strokeWidth = 28 }: Props) {
  const theme = useTheme();

  const validSlices = data.filter((d) => d.percentage > 0);
  const totalPct = validSlices.reduce((s, d) => s + d.percentage, 0);

  let cursor = 0;
  const slices = validSlices.map((slice) => {
    const sweep = (slice.percentage / totalPct) * 360;
    const start = cursor;
    cursor += sweep;
    return { ...slice, startAngle: start, sweepAngle: sweep };
  });

  const holeSize = size - strokeWidth * 2;

  return (
    <View style={{ width: size, height: size }}>
      {/* Background track */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.isDark ? '#2C3122' : '#E4E6D6',
        }}
      />

      {/* Colored segments (rendered back to front) */}
      {slices.map((slice) => (
        <DonutSlice
          key={slice.label}
          startAngle={slice.startAngle}
          sweepAngle={slice.sweepAngle}
          color={slice.color}
          size={size}
        />
      ))}

      {/* Center hole */}
      <View
        style={{
          position: 'absolute',
          width: holeSize,
          height: holeSize,
          borderRadius: holeSize / 2,
          backgroundColor: theme.surface,
          top: strokeWidth,
          left: strokeWidth,
        }}
      />
    </View>
  );
}
