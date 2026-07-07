import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FighterState } from '../types';

const ARENA_WIDTH = 100;

export function Fighter({ fighter, color }: { fighter: FighterState; color: string }) {
  const leftPercent = (fighter.x / ARENA_WIDTH) * 100;
  const actionScale = fighter.lastAction === 'punch' ? 1.15 : fighter.lastAction === 'kick' ? 1.25 : 1;

  return (
    <View style={[styles.wrapper, { left: `${leftPercent}%` }]}>
      <View
        style={[
          styles.body,
          { backgroundColor: fighter.ko ? '#555' : color },
          fighter.isBlocking && styles.blocking,
          { transform: [{ scaleX: fighter.facing * actionScale }, { scaleY: actionScale }] },
        ]}
      >
        <Text style={styles.emoji}>{fighter.ko ? '💫' : fighter.isBlocking ? '🛡️' : '🥊'}</Text>
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {fighter.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 24, alignItems: 'center', width: 64, marginLeft: -32 },
  body: {
    width: 56,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  blocking: { borderColor: '#42a5f5', borderWidth: 4 },
  emoji: { fontSize: 28 },
  label: { color: '#fff', marginTop: 4, fontSize: 12, fontWeight: '600' },
});
