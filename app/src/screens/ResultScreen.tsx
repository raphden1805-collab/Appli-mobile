import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MatchState } from '../types';

export function ResultScreen({ state, myId, onBackToLobby }: { state: MatchState; myId: string; onBackToLobby: () => void }) {
  const ranked = [...state.players].sort((a, b) => b.gold - a.gold);
  const iWon = state.winnerId === myId;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{iWon ? 'Victoire !' : 'Partie terminee'}</Text>
      <View style={styles.list}>
        {ranked.map((p, index) => (
          <View key={p.id} style={styles.row}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View style={[styles.dot, { backgroundColor: p.color }]} />
            <Text style={[styles.name, p.id === myId && styles.me]} numberOfLines={1}>
              {p.name}
            </Text>
            <Text style={styles.gold}>{Math.floor(p.gold)} or</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.cta} onPress={onBackToLobby}>
        <Text style={styles.ctaLabel}>Retour au lobby</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800' },
  list: { width: '100%', maxWidth: 360, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 10 },
  rank: { color: '#888', width: 28, fontWeight: '700' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { color: '#eee', flex: 1, fontWeight: '600' },
  me: { color: '#fdd835' },
  gold: { color: '#ffd54f', fontWeight: '700' },
  cta: { backgroundColor: '#1565c0', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  ctaLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
