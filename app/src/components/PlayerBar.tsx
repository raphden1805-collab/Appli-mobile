import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MatchPlayer } from '../types';

export function PlayerBar({ players, myId }: { players: MatchPlayer[]; myId: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {players.map((p) => (
        <View key={p.id} style={[styles.avatar, { borderColor: p.color }, p.id === myId && styles.me, !p.connected && styles.disconnected]}>
          <Text style={styles.initials}>{p.name.slice(0, 2).toUpperCase()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#222',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  me: { borderWidth: 3 },
  disconnected: { opacity: 0.35 },
  initials: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
