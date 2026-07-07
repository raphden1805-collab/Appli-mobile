import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function NameScreen({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Combat en ligne</Text>
      <Text style={styles.subtitle}>Jusqu'a 8 combattants connectes</Text>
      <TextInput
        style={styles.input}
        placeholder="Ton pseudo"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        maxLength={20}
      />
      <Pressable
        style={[styles.cta, !name.trim() && styles.ctaDisabled]}
        disabled={!name.trim()}
        onPress={() => onSubmit(name.trim())}
      >
        <Text style={styles.ctaLabel}>Chercher un adversaire</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#999', marginBottom: 32 },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cta: { backgroundColor: '#e53935', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, width: '100%' },
  ctaDisabled: { opacity: 0.4 },
  ctaLabel: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 },
});
