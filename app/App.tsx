import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { getSocket } from './src/network/socket';
import { NameScreen } from './src/screens/NameScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { FightScreen } from './src/screens/FightScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import type { ActionType, FightState } from './src/types';

type Screen = 'name' | 'queue' | 'fight' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('name');
  const [queuePosition, setQueuePosition] = useState(0);
  const [fightState, setFightState] = useState<FightState | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [serverFull, setServerFull] = useState(false);
  const myIdRef = useRef('');

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      myIdRef.current = socket.id ?? '';
    });
    socket.on('server_full', () => setServerFull(true));
    socket.on('queued', ({ position }: { position: number }) => setQueuePosition(position));
    socket.on('match_found', ({ state }: { state: FightState }) => {
      setOpponentLeft(false);
      setFightState(state);
      setScreen('fight');
    });
    socket.on('state_update', (state: FightState) => {
      setFightState(state);
      if (state.finished) setScreen('result');
    });
    socket.on('opponent_left', () => {
      setOpponentLeft(true);
      setScreen('result');
    });

    return () => {
      socket.off('connect');
      socket.off('server_full');
      socket.off('queued');
      socket.off('match_found');
      socket.off('state_update');
      socket.off('opponent_left');
    };
  }, []);

  const startSearch = useCallback((name: string) => {
    const socket = getSocket();
    socket.emit('join_queue', { name });
    setScreen('queue');
  }, []);

  const sendAction = useCallback((action: ActionType) => {
    getSocket().emit('action', { type: action });
  }, []);

  const rematch = useCallback(() => {
    const socket = getSocket();
    socket.emit('rematch');
    setFightState(null);
    setOpponentLeft(false);
    setScreen('name');
  }, []);

  if (serverFull) {
    return (
      <SafeAreaView style={styles.full}>
        <Text style={styles.fullText}>Serveur complet (8 joueurs max). Reessaie plus tard.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {screen === 'name' && <NameScreen onSubmit={startSearch} />}
      {screen === 'queue' && <QueueScreen queuePosition={queuePosition} />}
      {screen === 'fight' && fightState && (
        <FightScreen state={fightState} myId={myIdRef.current} onAction={sendAction} />
      )}
      {screen === 'result' && (
        <ResultScreen state={fightState} myId={myIdRef.current} opponentLeft={opponentLeft} onRematch={rematch} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  full: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullText: { color: '#fff', textAlign: 'center', fontSize: 16 },
});
