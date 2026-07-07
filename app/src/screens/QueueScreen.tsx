import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function QueueScreen({ queuePosition }: { queuePosition: number }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e53935" />
      <Text style={styles.text}>Recherche d'un adversaire...</Text>
      <Text style={styles.subtext}>Position dans la file : {queuePosition}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { color: '#fff', fontSize: 18, fontWeight: '600' },
  subtext: { color: '#999' },
});
