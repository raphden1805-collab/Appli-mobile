import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SERVER_URL } from '../config';

type Stats = { wins: number; matchesPlayed: number; playtimeMs: number };

const TABS = ['LOBBY', 'RANKS', 'LEADERBOARD', 'CUSTOM', 'SERVERS'] as const;
const SIDEBAR_ITEMS = [
  { icon: '📜', label: 'Missions' },
  { icon: '🎁', label: 'Recompenses' },
  { icon: '🔗', label: 'Codes' },
] as const;

function formatPlaytime(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  const [activeMatches, setActiveMatches] = useState<number | null>(null);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const sessionStartRef = useRef(new Date());

  useEffect(() => {
    const poll = () => {
      fetch(`${SERVER_URL}/health`)
        .then((res) => res.json())
        .then((data) => setActiveMatches(data.activeMatches))
        .catch(() => setActiveMatches(null));
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (queueState !== 'queued') {
      setSearchSeconds(0);
      return;
    }
    const id = setInterval(() => setSearchSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [queueState]);

  const showStub = (label: string) => {
    setStub(label);
    setTimeout(() => setStub(null), 1800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Empire Hex</Text>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable key={tab} onPress={() => tab !== 'LOBBY' && showStub(tab)}>
              <Text style={[styles.tab, tab === 'LOBBY' && styles.tabActive]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statsPanel}>
          <Text style={styles.statsTitle}>PLAYER STATS</Text>
          <Text style={styles.statLine}>Victoires : {stats.wins}</Text>
          <Text style={styles.statLine}>Parties jouees : {stats.matchesPlayed}</Text>
          <Text style={styles.statLine}>Temps de jeu : {formatPlaytime(stats.playtimeMs)}</Text>
          <Text style={styles.statLine}>
            En ligne depuis{' '}
            {sessionStartRef.current.getHours().toString().padStart(2, '0')}:
            {sessionStartRef.current.getMinutes().toString().padStart(2, '0')}
          </Text>
        </View>

        <View style={styles.center}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
        </View>

        <View style={styles.sidebar}>
          {SIDEBAR_ITEMS.map(({ icon, label }) => (
            <Pressable key={label} style={styles.sidebarButton} onPress={() => showStub(label)}>
              <Text style={styles.sidebarIcon}>{icon}</Text>
              <Text style={styles.sidebarLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {stub && (
        <View style={styles.stubToast}>
          <Text style={styles.stubText}>{stub} : bientot disponible</Text>
        </View>
      )}

      <View style={styles.systemLog}>
        <Text style={styles.systemLogText}>[Systeme] Connexion au serveur etablie.</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.modeBox}>
            <Text style={styles.modeLabel}>SELECTED MODE</Text>
            <Text style={styles.modeValue}>CASUAL</Text>
          </View>
          <View style={styles.buttonRow}>
            <Pressable style={styles.secondaryButton} onPress={onChangeName}>
              <Text style={styles.secondaryLabel}>CHANGE</Text>
            </Pressable>
            {queueState === 'idle' ? (
              <Pressable style={styles.primaryButton} onPress={onQueue}>
                <Text style={styles.primaryLabel}>QUEUE</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.cancelButton} onPress={onCancelQueue}>
                <Text style={styles.primaryLabel}>CANCEL</Text>
              </Pressable>
            )}
            <View style={[styles.secondaryButton, styles.leaveButton]}>
              <Text style={styles.leaveLabel}>LEAVE</Text>
            </View>
          </View>
        </View>

        {activeMatches !== null && (
          <Text style={styles.activeMatches}>{activeMatches} ACTIVE MATCHES</Text>
        )}
      </View>

      {queueState === 'queued' && (
        <View style={styles.queueCard}>
          <Pressable style={styles.queueCardClose} onPress={onCancelQueue}>
            <Text style={styles.queueCardCloseLabel}>x</Text>
          </Pressable>
          <Text style={styles.queueCardTitle}>FINDING A MATCH</Text>
          <Text style={styles.queueCardTimer}>{formatClock(searchSeconds)}</Text>
          <Text style={styles.queueCardSub}>{queuePosition} JOUEUR(S) EN FILE</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  header: { padding: 16, gap: 8 },
  brand: { color: '#fff', fontSize: 20, fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 18 },
  tab: { color: '#777', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  tabActive: { color: '#fff', textDecorationLine: 'underline' },
  body: { flex: 1, flexDirection: 'row', paddingHorizontal: 16, gap: 16 },
  statsPanel: { width: 170 },
  statsTitle: { color: '#888', fontWeight: '700', marginBottom: 8, fontSize: 11, letterSpacing: 1 },
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
  sidebar: { width: 100, gap: 10, paddingTop: 4 },
  sidebarButton: { backgroundColor: '#1e1e1e', borderRadius: 10, paddingVertical: 10, alignItems: 'center', gap: 4 },
  sidebarIcon: { fontSize: 20 },
  sidebarLabel: { color: '#ddd', fontSize: 11, fontWeight: '600' },
  stubToast: {
    alignSelf: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
  },
  stubText: { color: '#aaa', fontSize: 12 },
  systemLog: { paddingHorizontal: 16, marginBottom: 8 },
  systemLogText: { color: '#4caf50', fontSize: 11 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: 16 },
  footerLeft: { flex: 1, gap: 10 },
  modeBox: { alignSelf: 'flex-start', backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  modeLabel: { color: '#888', fontSize: 10, letterSpacing: 1 },
  modeValue: { color: '#fff', fontWeight: '800', fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  secondaryButton: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  secondaryLabel: { color: '#ccc', fontWeight: '700' },
  primaryButton: { flex: 1, backgroundColor: '#1565c0', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  cancelButton: { flex: 1, backgroundColor: '#c62828', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryLabel: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  leaveButton: { opacity: 0.4 },
  leaveLabel: { color: '#888', fontWeight: '700' },
  activeMatches: { color: '#888', fontSize: 11, marginLeft: 16 },
  queueCard: {
    position: 'absolute',
    right: 16,
    bottom: 92,
    backgroundColor: '#132a44',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1565c0',
  },
  queueCardClose: { position: 'absolute', top: 6, right: 8 },
  queueCardCloseLabel: { color: '#888', fontSize: 14, fontWeight: '700' },
  queueCardTitle: { color: '#42a5f5', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  queueCardTimer: { color: '#fff', fontWeight: '800', fontSize: 22, marginTop: 2 },
  queueCardSub: { color: '#9fc4ea', fontSize: 10, marginTop: 2 },
});
