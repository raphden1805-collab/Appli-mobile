import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

export function GroundDisc({
  color,
  dashed,
  width = 110,
  height = 40,
}: {
  color: string;
  dashed?: boolean;
  width?: number;
  height?: number;
}) {
  const gradientId = `ground-${color.replace('#', '')}${dashed ? '-d' : ''}`;
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="55%">
            <Stop offset="0%" stopColor={color} stopOpacity={dashed ? 0.12 : 0.35} />
            <Stop offset="70%" stopColor={color} stopOpacity={dashed ? 0.08 : 0.18} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 2} ry={height / 2 - 2} fill={`url(#${gradientId})`} />
        <Ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2 - 4}
          ry={height / 2 - 4}
          fill="none"
          stroke={color}
          strokeOpacity={dashed ? 0.35 : 0.75}
          strokeWidth={1.5}
          strokeDasharray={dashed ? '4 4' : undefined}
        />
      </Svg>
    </View>
  );
}
