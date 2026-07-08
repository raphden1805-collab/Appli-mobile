import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SERVER_URL } from '../config';
import { Character } from '../components/Character';
import { HexBackground } from '../components/HexBackground';
import { GroundDisc } from '../components/GroundDisc';
import { colorForName } from '../colorForName';
import type { PartyState, User } from '../types';

const TABS = ['LOBBY', 'RANKS', 'LEADERBOARD', 'BOUTIQUE', 'CUSTOM', 'SERVERS', 'COMPTE'] as const;
const SIDEBAR_ITEMS = [
  { icon: '📜', label: 'Missions' },
  { icon: '🎁', label: 'Recompenses' },
  { icon: '🔗', label: 'Codes' },
] as const;

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function renderPartySlot(mate: { id: number; username: string; online: boolean } | undefined, onOpenSocial: () => void) {
  const color = mate ? colorForName(mate.username) : '#ffffff';
  return (
    <Pressable style={styles.partySlot} onPress={onOpenSocial} disabled={Boolean(mate)}>
      {mate ? (
        <View style={styles.slotTop}>
          <View style={[styles.slotBadge, { borderColor: color }]}>
            <Text style={styles.slotInitials}>{mate.username.slice(0, 2).toUpperCase()}</Text>
            <View style={[styles.onlineDot, { backgroundColor: mate.online ? '#4caf50' : '#666' }]} />
          </View>
        </View>
      ) : (
        <Text style={styles.plusIcon}>+</Text>
      )}
      <GroundDisc color={color} dashed={!mate} width={140} height={50} />
      <Text style={styles.partySlotLabel} numberOfLines={1}>
        {mate ? mate.username : 'Inviter'}
      </Text>
    </Pressable>
  );
}

export function LobbyScreen({
  name,
  user,
  queueState,
  queuePosition,
  onQueue,
  onCancelQueue,
  onChangeName,
  onOpenAccount,
  party,
  onOpenSocial,
}: {
  name: string;
  user: User | null;
  queueState: 'idle' | 'queued';
  queuePosition: number;
  onQueue: () => void;
  onCancelQueue: () => void;
  onChangeName: () => void;
  onOpenAccount: () => void;
  party: PartyState;
  onOpenSocial: () => void;
}) {
  const [stub, setStub] = useState<string | null>(null);
  const [activeMatches, setActiveMatches] = useState<number | null>(null);
  const [searchSeconds, setSearchSeconds] = useState(0);

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

  const teammates = (party?.members ?? []).filter((m) => m.id !== user?.id);

  return (
    <View style={styles.container}>
      <HexBackground />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.brand}>Empire Hex</Text>
          <Pressable style={styles.socialButton} onPress={onOpenSocial}>
            <Text style={styles.socialButtonLabel}>👥 Amis{party ? ` (${party.members.length}/3)` : ''}</Text>
          </Pressable>
        </View>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, tab === 'LOBBY' && styles.tabActive]}
              onPress={() => {
                if (tab === 'LOBBY') return;
                if (tab === 'COMPTE') onOpenAccount();
                else showStub(tab);
              }}
            >
              <Text style={[styles.tabLabel, tab === 'LOBBY' && styles.tabLabelActive]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.center}>
          <View style={styles.centerRow}>
            {renderPartySlot(teammates[0], onOpenSocial)}

            <View style={styles.characterColumn}>
              <View style={styles.characterStage}>
                <Character color={colorForName(name)} />
              </View>
              <View style={styles.nameTag}>
                <Text style={styles.name}>{name}</Text>
              </View>
            </View>

            {renderPartySlot(teammates[1], onOpenSocial)}
          </View>
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
        <View style={styles.stubToast} pointerEvents="none">
          <Text style={styles.stubText}>{stub} : bientot disponible</Text>
        </View>
      )}

      <View style={styles.systemLog} pointerEvents="none">
        <Text style={styles.systemLogText}>[Systeme] Connexion au serveur etablie.</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerCenter}>
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
                <Text style={styles.primaryLabel}>PLAY</Text>
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
  header: { padding: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  brand: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
  tabs: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  tab: {
    backgroundColor: 'rgba(20,23,27,0.7)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: { backgroundColor: 'rgba(21,101,192,0.85)', borderColor: 'rgba(255,255,255,0.2)' },
  tabLabel: { color: '#999', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  tabLabelActive: { color: '#fff' },
  socialButton: {
    backgroundColor: 'rgba(21,101,192,0.85)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  socialButtonLabel: { color: '#fff', fontWeight: '700', fontSize: 12 },
  body: { flex: 1, position: 'relative' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  characterStage: { width: 360, height: 480 },
  nameTag: {
    backgroundColor: 'rgba(10,12,14,0.55)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  name: { color: '#fdd835', fontWeight: '700', fontSize: 16 },
  centerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 20 },
  characterColumn: { alignItems: 'center', gap: 8 },
  partySlot: { alignItems: 'center', gap: 4, width: 150, marginBottom: 66 },
  slotTop: { alignItems: 'center', justifyContent: 'center', height: 32 },
  plusIcon: { color: 'rgba(255,255,255,0.55)', fontSize: 28, fontWeight: '300', height: 32, lineHeight: 32 },
  slotBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20,23,27,0.85)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotInitials: { color: '#fff', fontWeight: '800', fontSize: 11 },
  onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#0d0d0d' },
  partySlotLabel: { color: '#aaa', fontSize: 11, fontWeight: '600', marginTop: 2 },
  sidebar: { position: 'absolute', top: 0, right: 16, width: 100, gap: 10, paddingTop: 4 },
  sidebarButton: {
    backgroundColor: 'rgba(20,23,27,0.65)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sidebarIcon: { fontSize: 20 },
  sidebarLabel: { color: '#ddd', fontSize: 11, fontWeight: '600' },
  stubToast: {
    alignSelf: 'center',
    backgroundColor: 'rgba(20,23,27,0.85)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
  },
  stubText: { color: '#aaa', fontSize: 12 },
  systemLog: { paddingHorizontal: 16, marginBottom: 8 },
  systemLogText: { color: '#4caf50', fontSize: 11, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  footer: { height: 116, paddingHorizontal: 16, alignItems: 'flex-end', justifyContent: 'flex-end' },
  footerCenter: { position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center', gap: 10 },
  modeBox: {
    backgroundColor: 'rgba(18,20,24,0.7)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modeLabel: { color: '#888', fontSize: 10, letterSpacing: 1, textAlign: 'center' },
  modeValue: { color: '#fff', fontWeight: '800', fontSize: 14, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    width: 96,
    backgroundColor: 'rgba(24,27,31,0.8)',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  secondaryLabel: { color: '#ccc', fontWeight: '700', fontSize: 12 },
  primaryButton: { width: 96, backgroundColor: '#1565c0', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  cancelButton: { width: 96, backgroundColor: '#c62828', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  primaryLabel: { color: '#fff', fontWeight: '800', letterSpacing: 1, fontSize: 12 },
  leaveButton: { opacity: 0.4 },
  leaveLabel: { color: '#888', fontWeight: '700', fontSize: 12 },
  activeMatches: { color: '#888', fontSize: 11 },
  queueCard: {
    position: 'absolute',
    right: 16,
    bottom: 92,
    backgroundColor: 'rgba(19,42,68,0.92)',
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
