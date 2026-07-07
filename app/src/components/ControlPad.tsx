import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ActionType } from '../types';

export function ControlPad({ onAction }: { onAction: (action: ActionType) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.group}>
        <Button label="◀" onPressIn={() => onAction('move_left')} onPressOut={() => onAction('move_stop')} />
        <Button label="▶" onPressIn={() => onAction('move_right')} onPressOut={() => onAction('move_stop')} />
      </View>
      <View style={styles.group}>
        <Button label="🛡️" onPressIn={() => onAction('block_start')} onPressOut={() => onAction('block_stop')} />
        <Button label="👊" onPressIn={() => onAction('punch')} />
        <Button label="🦵" onPressIn={() => onAction('kick')} />
      </View>
    </View>
  );
}

function Button({ label, onPressIn, onPressOut }: { label: string; onPressIn: () => void; onPressOut?: () => void }) {
  return (
    <Pressable style={styles.button} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  group: { flexDirection: 'row', gap: 10 },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonLabel: { fontSize: 24 },
});
