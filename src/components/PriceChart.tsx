import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { radii } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  data: number[];
  width: number;
  height: number;
}

export const PriceChart: React.FC<Props> = ({ data, width, height }) => {
  const { theme } = useTheme();

  if (data.length < 2) return null;

  const padding = 16;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((val - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((val - min) / range) * chartHeight;
    return { x, y };
  });

  const firstX = padding;
  const lastX = padding + chartWidth;
  let areaPath = `M ${areaPoints[0].x} ${areaPoints[0].y}`;
  areaPoints.forEach((p, i) => {
    if (i > 0) areaPath += ` L ${p.x} ${p.y}`;
  });
  areaPath += ` L ${lastX} ${padding + chartHeight} L ${firstX} ${padding + chartHeight} Z`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.accent} stopOpacity="0.3" />
            <Stop offset="1" stopColor={theme.accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} rx={radii.button} fill={theme.secondaryBg} />
        <Path d={areaPath} fill="url(#accentGradient)" />
        <Polyline
          points={points}
          fill="none"
          stroke={theme.accent}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.button,
    overflow: 'hidden',
  },
});
