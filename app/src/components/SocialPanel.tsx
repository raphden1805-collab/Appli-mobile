import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { FriendEntry, PartyState, PendingFriendRequest, User } from '../types';

export function SocialPanel({
  visible,
  onClose,
  user,
  onRequestLogin,
  friends,
  pendingRequests,
  party,
  partyInvite,
  onAddFriend,
  onRespondRequest,
  onInviteToParty,
  onRespondPartyInvite,
  onLeaveParty,
  onStartTeamMatch,
  feedback,
}: {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onRequestLogin: () => void;
  friends: FriendEntry[];
  pendingRequests: PendingFriendRequest[];
  party: PartyState;
  partyInvite: { fromUsername: string } | null;
  onAddFriend: (username: string) => void;
  onRespondRequest: (requestId: number, accept: boolean) => void;
  onInviteToParty: (username: string) => void;
  onRespondPartyInvite: (accept: boolean) => void;
  onLeaveParty: () => void;
  onStartTeamMatch: () => void;
  feedback: string | null;
}) {
  const [friendName, setFriendName] = useState('');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Amis & Groupe</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Fermer</Text>
            </Pressable>
          </View>

          {!user ? (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Connecte-toi pour ajouter des amis et jouer en equipe.</Text>
              <Pressable style={styles.primaryButton} onPress={onRequestLogin}>
                <Text style={styles.primaryLabel}>Se connecter</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView style={styles.body}>
              {feedback && <Text style={styles.feedback}>{feedback}</Text>}

              {partyInvite && (
                <View style={styles.inviteBanner}>
                  <Text style={styles.inviteText}>{partyInvite.fromUsername} t'invite dans son groupe</Text>
                  <View style={styles.row}>
                    <Pressable style={styles.smallButton} onPress={() => onRespondPartyInvite(true)}>
                      <Text style={styles.smallButtonLabel}>Accepter</Text>
                    </Pressable>
                    <Pressable style={[styles.smallButton, styles.smallButtonMuted]} onPress={() => onRespondPartyInvite(false)}>
                      <Text style={styles.smallButtonLabel}>Refuser</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>GROUPE ({party?.members.length ?? 0}/3)</Text>
              {party && party.members.length > 0 ? (
                <View style={styles.partyBox}>
                  {party.members.map((m) => (
                    <Text key={m.id} style={styles.partyMember}>
                      {m.online ? '●' : '○'} {m.username} {m.id === user.id ? '(toi)' : ''}
                    </Text>
                  ))}
                  <View style={styles.row}>
                    <Pressable style={[styles.smallButton, styles.smallButtonMuted]} onPress={onLeaveParty}>
                      <Text style={styles.smallButtonLabel}>Quitter</Text>
                    </Pressable>
                    {party.members.length >= 2 && (
                      <Pressable style={styles.smallButton} onPress={onStartTeamMatch}>
                        <Text style={styles.smallButtonLabel}>Lancer l'empire commun</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>Invite un ami pour former un groupe (2-3 joueurs).</Text>
              )}

              {pendingRequests.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>DEMANDES D'AMI</Text>
                  {pendingRequests.map((r) => (
                    <View key={r.requestId} style={styles.requestRow}>
                      <Text style={styles.requestName}>{r.from.username}</Text>
                      <View style={styles.row}>
                        <Pressable style={styles.smallButton} onPress={() => onRespondRequest(r.requestId, true)}>
                          <Text style={styles.smallButtonLabel}>Accepter</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.smallButton, styles.smallButtonMuted]}
                          onPress={() => onRespondRequest(r.requestId, false)}
                        >
                          <Text style={styles.smallButtonLabel}>Refuser</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </>
              )}

              <Text style={styles.sectionTitle}>AJOUTER UN AMI</Text>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  placeholder="Pseudo exact"
                  placeholderTextColor="#888"
                  value={friendName}
                  onChangeText={setFriendName}
                  autoCapitalize="none"
                />
                <Pressable
                  style={[styles.smallButton, !friendName.trim() && styles.smallButtonDisabled]}
                  disabled={!friendName.trim()}
                  onPress={() => {
                    onAddFriend(friendName.trim());
                    setFriendName('');
                  }}
                >
                  <Text style={styles.smallButtonLabel}>Ajouter</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>MES AMIS ({friends.length})</Text>
              {friends.length === 0 && <Text style={styles.emptyText}>Aucun ami pour le moment.</Text>}
              {friends.map((f) => (
                <View key={f.id} style={styles.requestRow}>
                  <Text style={styles.requestName}>
                    {f.online ? '●' : '○'} {f.username}
                  </Text>
                  <Pressable style={styles.smallButton} onPress={() => onInviteToParty(f.username)}>
                    <Text style={styles.smallButtonLabel}>Inviter au groupe</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#14171b', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  close: { color: '#42a5f5', fontWeight: '700' },
  loginPrompt: { alignItems: 'center', paddingVertical: 24, gap: 16 },
  loginText: { color: '#ccc', textAlign: 'center' },
  body: { maxHeight: 480 },
  feedback: { color: '#ffd54f', fontSize: 12, marginBottom: 10 },
  sectionTitle: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  emptyText: { color: '#666', fontSize: 13 },
  partyBox: { backgroundColor: '#1c2530', borderRadius: 10, padding: 12, gap: 6 },
  partyMember: { color: '#eee', fontSize: 14 },
  inviteBanner: { backgroundColor: '#1c2530', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1565c0' },
  inviteText: { color: '#fff', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1d22',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  requestName: { color: '#eee', fontWeight: '600' },
  input: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  primaryButton: { backgroundColor: '#1565c0', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  primaryLabel: { color: '#fff', fontWeight: '700' },
  smallButton: { backgroundColor: '#1565c0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  smallButtonMuted: { backgroundColor: '#333' },
  smallButtonDisabled: { opacity: 0.4 },
  smallButtonLabel: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
