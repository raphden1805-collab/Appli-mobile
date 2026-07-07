import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HEX_R = 30;
const GREYS = ['#181b1f', '#1c2025', '#20242a', '#252a31', '#292e35'];

function hashInt(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) ^ (a << 13);
  h = (h ^ (h >>> 15)) >>> 0;
  return h;
}

function hexPoints(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

export function HexBackground() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 3400, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 3400, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const hexes = useMemo(() => {
    if (!size.w || !size.h) return [];
    const stepX = HEX_R * Math.sqrt(3);
    const stepY = HEX_R * 1.5;
    const rows = Math.ceil(size.h / stepY) + 2;
    const cols = Math.ceil(size.w / stepX) + 2;
    const list: { key: string; x: number; y: number; color: string }[] = [];
    for (let r = -1; r <= rows; r += 1) {
      for (let q = -1; q <= cols; q += 1) {
        const x = stepX * (q + (Math.abs(r % 2) === 1 ? 0.5 : 0));
        const y = stepY * r;
        list.push({ key: `${q}_${r}`, x, y, color: GREYS[hashInt(q, r) % GREYS.length] });
      }
    }
    return list;
  }, [size]);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.2] });

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: width, h: height });
      }}
    >
      {size.w > 0 && size.h > 0 && (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="#0f1214" />
          {hexes.map((h) => (
            <Polygon key={h.key} points={hexPoints(h.x, h.y, HEX_R - 1.5)} fill={h.color} stroke="#000000" strokeWidth={1} />
          ))}
          <Defs>
            <RadialGradient id="vignette" cx="50%" cy="40%" r="68%">
              <Stop offset="0%" stopColor="#000000" stopOpacity={0} />
              <Stop offset="65%" stopColor="#000000" stopOpacity={0.3} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={0.82} />
            </RadialGradient>
          </Defs>
          <AnimatedCircle cx={size.w / 2} cy={size.h * 0.4} r={size.w * 0.22} fill="#3d6b8f" opacity={glowOpacity} />
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#vignette)" />
        </Svg>
      )}
    </View>
  );
}
