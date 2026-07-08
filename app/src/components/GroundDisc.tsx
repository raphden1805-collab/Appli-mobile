import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

const WIDTH = 110;
const HEIGHT = 40;

export function GroundDisc({ color, dashed }: { color: string; dashed?: boolean }) {
  const gradientId = `ground-${color.replace('#', '')}${dashed ? '-d' : ''}`;
  return (
    <View style={{ width: WIDTH, height: HEIGHT }}>
      <Svg width={WIDTH} height={HEIGHT}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="55%">
            <Stop offset="0%" stopColor={color} stopOpacity={dashed ? 0.12 : 0.35} />
            <Stop offset="70%" stopColor={color} stopOpacity={dashed ? 0.08 : 0.18} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={WIDTH / 2} cy={HEIGHT / 2} rx={WIDTH / 2 - 2} ry={HEIGHT / 2 - 2} fill={`url(#${gradientId})`} />
        <Ellipse
          cx={WIDTH / 2}
          cy={HEIGHT / 2}
          rx={WIDTH / 2 - 4}
          ry={HEIGHT / 2 - 4}
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
