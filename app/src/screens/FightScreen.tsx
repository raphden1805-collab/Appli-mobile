import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HealthBar } from '../components/HealthBar';
import { Fighter } from '../components/Fighter';
import { ControlPad } from '../components/ControlPad';
import type { ActionType, FightState } from '../types';

export function FightScreen({
  state,
  myId,
  onAction,
}: {
  state: FightState;
  myId: string;
  onAction: (action: ActionType) => void;
}) {
  const [f1, f2] = state.fighters;
  const seconds = Math.ceil(state.timeRemainingMs / 1000);

  return (
    <View style={styles.container}>
      <View style={styles.hud}>
        <HealthBar name={f1.name} health={f1.health} align="left" />
        <Text style={styles.timer}>{seconds}</Text>
        <HealthBar name={f2.name} health={f2.health} align="right" />
      </View>

      <View style={styles.arena}>
        <Fighter fighter={f1} color="#42a5f5" />
        <Fighter fighter={f2} color="#ef5350" />
      </View>

      <ControlPad onAction={onAction} />
      <Text style={styles.hint}>
        {myId === f1.id ? 'Tu es ' + f1.name : myId === f2.id ? 'Tu es ' + f2.name : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  hud: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  timer: { color: '#fff', fontSize: 20, fontWeight: '800', width: 40, textAlign: 'center' },
  arena: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#1b2a3a',
    overflow: 'hidden',
  },
  hint: { color: '#666', textAlign: 'center', marginBottom: 8 },
});
