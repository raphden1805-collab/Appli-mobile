import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Stats = { wins: number; matchesPlayed: number; playtimeMs: number };

function formatPlaytime(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

export function LobbyScreen({
  name,
  stats,
  queueState,
  queuePosition,
  onQueue,
  onCancelQueue,
  onChangeName,
}: {
  name: string;
  stats: Stats;
  queueState: 'idle' | 'queued';
  queuePosition: number;
  onQueue: () => void;
  onCancelQueue: () => void;
  onChangeName: () => void;
}) {
  const [stub, setStub] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Empire Hex</Text>
        <Text style={styles.mode}>CASUAL</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.statsPanel}>
          <Text style={styles.statsTitle}>STATS JOUEUR</Text>
          <Text style={styles.statLine}>Victoires : {stats.wins}</Text>
          <Text style={styles.statLine}>Parties jouees : {stats.matchesPlayed}</Text>
          <Text style={styles.statLine}>Temps de jeu : {formatPlaytime(stats.playtimeMs)}</Text>
        </View>

        <View style={styles.center}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>

          {queueState === 'queued' && (
            <View style={styles.queueToast}>
              <Text style={styles.queueToastTitle}>Recherche de partie...</Text>
              <Text style={styles.queueToastSub}>{queuePosition} joueur(s) en attente</Text>
            </View>
          )}
        </View>

        <View style={styles.sidebar}>
          {(['Missions', 'Recompenses', 'Codes'] as const).map((label) => (
            <Pressable key={label} style={styles.sidebarButton} onPress={() => setStub(label)}>
              <Text style={styles.sidebarLabel}>{label}</Text>
            </Pressable>
          ))}
          {stub && <Text style={styles.stubText}>{stub} : bientot disponible</Text>}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.secondaryButton} onPress={onChangeName}>
          <Text style={styles.secondaryLabel}>CHANGER DE PSEUDO</Text>
        </Pressable>
        {queueState === 'idle' ? (
          <Pressable style={styles.primaryButton} onPress={onQueue}>
            <Text style={styles.primaryLabel}>QUEUE</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.cancelButton} onPress={onCancelQueue}>
            <Text style={styles.primaryLabel}>ANNULER</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  brand: { color: '#fff', fontSize: 20, fontWeight: '800' },
  mode: { color: '#42a5f5', fontWeight: '700', letterSpacing: 1 },
  body: { flex: 1, flexDirection: 'row', padding: 16, gap: 16 },
  statsPanel: { width: 160 },
  statsTitle: { color: '#888', fontWeight: '700', marginBottom: 8, fontSize: 12 },
  statLine: { color: '#ccc', marginBottom: 4, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2b2b2b',
    borderWidth: 2,
    borderColor: '#e0106b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { color: '#fdd835', fontWeight: '700', fontSize: 16 },
  queueToast: {
    marginTop: 20,
    backgroundColor: '#1565c0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  queueToastTitle: { color: '#fff', fontWeight: '700' },
  queueToastSub: { color: '#cfe8ff', fontSize: 12, marginTop: 2 },
  sidebar: { width: 140, gap: 10 },
  sidebarButton: { backgroundColor: '#1e1e1e', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  sidebarLabel: { color: '#ddd', fontSize: 13, fontWeight: '600' },
  stubText: { color: '#777', fontSize: 11, marginTop: 4, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: 12, padding: 16 },
  secondaryButton: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  secondaryLabel: { color: '#ccc', fontWeight: '700' },
  primaryButton: { flex: 1, backgroundColor: '#1565c0', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  cancelButton: { flex: 1, backgroundColor: '#c62828', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryLabel: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
});
