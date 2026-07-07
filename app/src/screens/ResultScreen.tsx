import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FightState } from '../types';

export function ResultScreen({
  state,
  myId,
  opponentLeft,
  onRematch,
}: {
  state: FightState | null;
  myId: string;
  opponentLeft: boolean;
  onRematch: () => void;
}) {
  let title = 'Match nul';
  if (opponentLeft) {
    title = "Ton adversaire a quitte";
  } else if (state?.winnerId) {
    title = state.winnerId === myId ? 'Victoire !' : 'Defaite';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Pressable style={styles.cta} onPress={onRematch}>
        <Text style={styles.ctaLabel}>Rejouer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', gap: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800' },
  cta: { backgroundColor: '#e53935', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  ctaLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
