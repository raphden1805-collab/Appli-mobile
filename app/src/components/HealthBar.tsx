import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function HealthBar({ name, health, align }: { name: string; health: number; align: 'left' | 'right' }) {
  return (
    <View style={[styles.container, align === 'right' && styles.containerRight]}>
      <Text style={[styles.name, align === 'right' && styles.textRight]} numberOfLines={1}>
        {name}
      </Text>
      <View style={[styles.track, align === 'right' && styles.trackRight]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(0, Math.min(100, health))}%` },
            health < 30 && styles.fillLow,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerRight: { alignItems: 'flex-end' },
  name: { color: '#fff', fontWeight: '700', marginBottom: 4 },
  textRight: { textAlign: 'right' },
  track: { height: 16, borderRadius: 8, backgroundColor: '#3a3a3a', overflow: 'hidden', width: '100%' },
  trackRight: { alignItems: 'flex-end' },
  fill: { height: '100%', backgroundColor: '#4caf50', borderRadius: 8 },
  fillLow: { backgroundColor: '#e53935' },
});
