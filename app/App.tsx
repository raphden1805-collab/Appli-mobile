import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { getSocket } from './src/network/socket';
import { NameScreen } from './src/screens/NameScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { MatchScreen } from './src/screens/MatchScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import type { BuildingCatalog, MatchState, Tile } from './src/types';

type Screen = 'name' | 'lobby' | 'match' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('name');
  const [playerName, setPlayerName] = useState('');
  const [queueState, setQueueState] = useState<'idle' | 'queued'>('idle');
  const [queuePosition, setQueuePosition] = useState(0);
  const [catalog, setCatalog] = useState<BuildingCatalog>({});
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [islandRadius, setIslandRadius] = useState(6);
  const [serverFull, setServerFull] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({ wins: 0, matchesPlayed: 0, playtimeMs: 0 });
  const myIdRef = useRef('');
  const matchStartedAtRef = useRef(0);
  const rejectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      myIdRef.current = socket.id ?? '';
    });
    socket.on('server_full', () => setServerFull(true));
    socket.on('building_catalog', (c: BuildingCatalog) => setCatalog(c));
    socket.on('queued', ({ position }: { position: number }) => setQueuePosition(position));
    socket.on('match_found', ({ state, islandRadius: radius }: { state: MatchState; islandRadius: number }) => {
      setQueueState('idle');
      setMatchState(state);
      setIslandRadius(radius);
      matchStartedAtRef.current = Date.now();
      setScreen('match');
    });
    socket.on('state_update', (state: MatchState) => {
      setMatchState(state);
      if (state.finished) {
        const playedMs = Date.now() - matchStartedAtRef.current;
        setStats((prev) => ({
          wins: prev.wins + (state.winnerId === myIdRef.current ? 1 : 0),
          matchesPlayed: prev.matchesPlayed + 1,
          playtimeMs: prev.playtimeMs + playedMs,
        }));
        setScreen('result');
      }
    });
    socket.on('place_building_rejected', ({ error }: { error: string }) => {
      if (rejectionTimerRef.current) clearTimeout(rejectionTimerRef.current);
      setRejectionMessage(rejectionMessageFor(error));
      rejectionTimerRef.current = setTimeout(() => setRejectionMessage(null), 2000);
    });

    return () => {
      socket.off('connect');
      socket.off('server_full');
      socket.off('building_catalog');
      socket.off('queued');
      socket.off('match_found');
      socket.off('state_update');
      socket.off('place_building_rejected');
    };
  }, []);

  const submitName = useCallback((name: string) => {
    setPlayerName(name);
    setScreen('lobby');
  }, []);

  const startQueue = useCallback(() => {
    getSocket().emit('join_queue', { name: playerName });
    setQueueState('queued');
  }, [playerName]);

  const cancelQueue = useCallback(() => {
    getSocket().emit('leave_queue');
    setQueueState('idle');
  }, []);

  const placeBuilding = useCallback((tile: Tile, buildingId: string) => {
    getSocket().emit('place_building', { q: tile.q, r: tile.r, buildingTypeId: buildingId });
  }, []);

  const backToLobby = useCallback(() => {
    getSocket().emit('leave_match');
    setMatchState(null);
    setScreen('lobby');
  }, []);

  if (serverFull) {
    return (
      <SafeAreaView style={styles.full}>
        <Text style={styles.fullText}>Serveur complet. Reessaie plus tard.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {screen === 'name' && <NameScreen onSubmit={submitName} />}
      {screen === 'lobby' && (
        <LobbyScreen
          name={playerName}
          stats={stats}
          queueState={queueState}
          queuePosition={queuePosition}
          onQueue={startQueue}
          onCancelQueue={cancelQueue}
          onChangeName={() => setScreen('name')}
        />
      )}
      {screen === 'match' && matchState && (
        <MatchScreen
          state={matchState}
          myId={myIdRef.current}
          catalog={catalog}
          islandRadius={islandRadius}
          rejectionMessage={rejectionMessage}
          onPlaceBuilding={placeBuilding}
        />
      )}
      {screen === 'result' && matchState && (
        <ResultScreen state={matchState} myId={myIdRef.current} onBackToLobby={backToLobby} />
      )}
    </SafeAreaView>
  );
}

function rejectionMessageFor(error: string) {
  switch (error) {
    case 'not_enough_gold':
      return "Pas assez d'or";
    case 'tile_occupied':
      return 'Case deja occupee';
    case 'match_not_active':
      return "La partie n'a pas encore commence";
    default:
      return 'Construction impossible';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  full: { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullText: { color: '#fff', textAlign: 'center', fontSize: 16 },
});
