import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getSocket } from '../network/socket';
import type { User } from '../types';

type Mode = 'login' | 'register';

export function AuthScreen({
  onAuthenticated,
  onGuest,
}: {
  onAuthenticated: (user: User, token: string) => void;
  onGuest: () => void;
}) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setError(null);
    setBusy(true);
    getSocket().emit(mode, { username: username.trim(), password }, (result: any) => {
      setBusy(false);
      if (result?.error) {
        setError(errorMessageFor(result.error));
        return;
      }
      onAuthenticated(result.user, result.token);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Empire Hex</Text>
      <Text style={styles.subtitle}>Connecte-toi pour retrouver tes amis et jouer en equipe</Text>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, mode === 'login' && styles.tabActive]} onPress={() => setMode('login')}>
          <Text style={[styles.tabLabel, mode === 'login' && styles.tabLabelActive]}>Connexion</Text>
        </Pressable>
        <Pressable style={[styles.tab, mode === 'register' && styles.tabActive]} onPress={() => setMode('register')}>
          <Text style={[styles.tabLabel, mode === 'register' && styles.tabLabelActive]}>Inscription</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Pseudo (3-20 caracteres)"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        maxLength={20}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.cta, (!username.trim() || !password || busy) && styles.ctaDisabled]}
        disabled={!username.trim() || !password || busy}
        onPress={submit}
      >
        <Text style={styles.ctaLabel}>{mode === 'login' ? 'Se connecter' : "S'inscrire"}</Text>
      </Pressable>

      <Pressable style={styles.guestButton} onPress={onGuest}>
        <Text style={styles.guestLabel}>Continuer sans compte</Text>
      </Pressable>
    </View>
  );
}

function errorMessageFor(error: string) {
  switch (error) {
    case 'invalid_username':
      return 'Pseudo invalide (3-20 caracteres, lettres/chiffres/_)';
    case 'invalid_password':
      return 'Mot de passe trop court (4 caracteres min.)';
    case 'username_taken':
      return 'Ce pseudo est deja pris';
    case 'invalid_credentials':
      return 'Pseudo ou mot de passe incorrect';
    default:
      return 'Une erreur est survenue';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#999', marginBottom: 24, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 10, padding: 4, marginBottom: 16, width: '100%' },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#1565c0' },
  tabLabel: { color: '#999', fontWeight: '700' },
  tabLabelActive: { color: '#fff' },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  error: { color: '#ef5350', marginBottom: 12, fontSize: 13, textAlign: 'center' },
  cta: { backgroundColor: '#e0106b', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, width: '100%' },
  ctaDisabled: { opacity: 0.4 },
  ctaLabel: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  guestButton: { marginTop: 16, padding: 8 },
  guestLabel: { color: '#888', fontWeight: '600', textDecorationLine: 'underline' },
});
