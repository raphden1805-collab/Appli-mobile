import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HexBackground } from '../components/HexBackground';
import { colorForName } from '../colorForName';
import type { Stats, User } from '../types';

function formatPlaytime(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

export function AccountScreen({
  user,
  stats,
  onBack,
  onLogin,
  onLogout,
}: {
  user: User | null;
  stats: Stats;
  onBack: () => void;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const winRate = stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;

  return (
    <View style={styles.container}>
      <HexBackground />

      <View style={styles.header}>
        <Text style={styles.title}>Mon compte</Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
      </View>

      {!user ? (
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.guestText}>Tu n'es pas connecte.</Text>
            <Text style={styles.guestSubtext}>Connecte-toi pour retrouver tes stats sur tous tes appareils.</Text>
            <Pressable style={styles.primaryButton} onPress={onLogin}>
              <Text style={styles.primaryLabel}>Se connecter</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { borderColor: colorForName(user.username) }]}>
              <Text style={styles.avatarInitials}>{user.username.slice(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={styles.username}>{user.username}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>STATS DU COMPTE</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.wins}</Text>
                <Text style={styles.statLabel}>Victoires</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.matchesPlayed}</Text>
                <Text style={styles.statLabel}>Parties jouees</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{winRate}%</Text>
                <Text style={styles.statLabel}>Taux de victoire</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatPlaytime(stats.playtimeMs)}</Text>
                <Text style={styles.statLabel}>Temps de jeu</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutLabel}>Se deconnecter</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  backButton: {
    backgroundColor: 'rgba(24,27,31,0.8)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backLabel: { color: '#ccc', fontWeight: '700', fontSize: 12 },
  body: { flex: 1, alignItems: 'center', paddingTop: 24, paddingHorizontal: 24, gap: 20 },
  profileRow: { alignItems: 'center', gap: 10 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(20,23,27,0.85)',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontWeight: '800', fontSize: 24 },
  username: { color: '#fdd835', fontWeight: '700', fontSize: 18 },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(14,16,19,0.7)',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { color: '#8a8f96', fontWeight: '700', fontSize: 11, letterSpacing: 1, marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { width: '47%', backgroundColor: 'rgba(24,27,31,0.7)', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  statValue: { color: '#fff', fontWeight: '800', fontSize: 20 },
  statLabel: { color: '#999', fontSize: 11, marginTop: 4, textAlign: 'center' },
  guestText: { color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  guestSubtext: { color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  primaryButton: { backgroundColor: '#1565c0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryLabel: { color: '#fff', fontWeight: '700' },
  logoutButton: {
    backgroundColor: 'rgba(198,40,40,0.15)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(198,40,40,0.4)',
  },
  logoutLabel: { color: '#ef5350', fontWeight: '700', fontSize: 13 },
});
