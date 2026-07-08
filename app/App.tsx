import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { getSocket } from './src/network/socket';
import { AuthScreen } from './src/screens/AuthScreen';
import { NameScreen } from './src/screens/NameScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { MatchScreen } from './src/screens/MatchScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { SocialPanel } from './src/components/SocialPanel';
import type {
  BuildingCatalog,
  FriendEntry,
  MatchState,
  PartyState,
  PendingFriendRequest,
  Stats,
  Tile,
  User,
} from './src/types';

type Screen = 'auth' | 'name' | 'lobby' | 'match' | 'result' | 'account';

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [playerName, setPlayerName] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [queueState, setQueueState] = useState<'idle' | 'queued'>('idle');
  const [queuePosition, setQueuePosition] = useState(0);
  const [catalog, setCatalog] = useState<BuildingCatalog>({});
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [islandRadius, setIslandRadius] = useState(6);
  const [serverFull, setServerFull] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ wins: 0, matchesPlayed: 0, playtimeMs: 0 });

  const [socialVisible, setSocialVisible] = useState(false);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);
  const [party, setParty] = useState<PartyState>(null);
  const [partyInvite, setPartyInvite] = useState<{ fromUsername: string } | null>(null);
  const [socialFeedback, setSocialFeedback] = useState<string | null>(null);

  const myIdRef = useRef('');
  const matchStartedAtRef = useRef(0);
  const rejectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((message: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setSocialFeedback(message);
    feedbackTimerRef.current = setTimeout(() => setSocialFeedback(null), 2500);
  }, []);

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
      setSocialVisible(false);
      setMatchState(state);
      setIslandRadius(radius);
      matchStartedAtRef.current = Date.now();
      setScreen('match');
    });
    socket.on('state_update', (state: MatchState) => {
      setMatchState(state);
      if (state.finished) {
        const playedMs = Date.now() - matchStartedAtRef.current;
        const myEntry = state.players.find((p) => p.id === myIdRef.current);
        const won = !state.isTeamMatch && state.winnerId === myEntry?.nationId;
        setStats((prev) => ({
          wins: prev.wins + (won ? 1 : 0),
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

    socket.on('friends_list', ({ friends: f, pending }: { friends: FriendEntry[]; pending: PendingFriendRequest[] }) => {
      setFriends(f);
      setPendingRequests(pending);
    });
    socket.on('party_state', (payload: NonNullable<PartyState>) => {
      setParty(payload.members && payload.members.length > 0 ? payload : null);
    });
    socket.on('party_invite_received', ({ fromUsername }: { fromUsername: string }) => {
      setPartyInvite({ fromUsername });
    });

    return () => {
      socket.off('connect');
      socket.off('server_full');
      socket.off('building_catalog');
      socket.off('queued');
      socket.off('match_found');
      socket.off('state_update');
      socket.off('place_building_rejected');
      socket.off('friends_list');
      socket.off('party_state');
      socket.off('party_invite_received');
    };
  }, []);

  const handleAuthenticated = useCallback((authedUser: User) => {
    setUser(authedUser);
    setPlayerName(authedUser.username);
    setScreen('lobby');
  }, []);

  const handleGuest = useCallback(() => setScreen('name'), []);

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

  const addFriend = useCallback(
    (username: string) => {
      getSocket().emit('friend_request_send', { username }, (res: any) => {
        if (res?.error) showFeedback(friendErrorMessage(res.error));
        else showFeedback('Demande envoyee');
      });
    },
    [showFeedback]
  );

  const respondRequest = useCallback(
    (requestId: number, accept: boolean) => {
      getSocket().emit('friend_request_respond', { requestId, accept }, (res: any) => {
        if (res?.error) showFeedback(friendErrorMessage(res.error));
      });
    },
    [showFeedback]
  );

  const inviteToParty = useCallback(
    (username: string) => {
      getSocket().emit('party_invite', { username }, (res: any) => {
        if (res?.error) showFeedback(partyErrorMessage(res.error));
        else showFeedback('Invitation envoyee');
      });
    },
    [showFeedback]
  );

  const respondPartyInvite = useCallback((accept: boolean) => {
    getSocket().emit('party_invite_respond', { accept }, () => {
      setPartyInvite(null);
    });
  }, []);

  const leaveParty = useCallback(() => {
    getSocket().emit('party_leave', {}, () => setParty(null));
  }, []);

  const startTeamMatch = useCallback(() => {
    getSocket().emit('start_team_match', {}, (res: any) => {
      if (res?.error) showFeedback(partyErrorMessage(res.error));
    });
  }, [showFeedback]);

  const openSocial = useCallback(() => setSocialVisible(true), []);
  const closeSocial = useCallback(() => setSocialVisible(false), []);
  const requestLogin = useCallback(() => {
    setSocialVisible(false);
    setScreen('auth');
  }, []);

  const openAccount = useCallback(() => setScreen('account'), []);
  const logout = useCallback(() => {
    getSocket().emit('logout', {}, () => {
      setUser(null);
      setParty(null);
      setFriends([]);
      setPendingRequests([]);
      setScreen('auth');
    });
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
      {screen === 'auth' && <AuthScreen onAuthenticated={handleAuthenticated} onGuest={handleGuest} />}
      {screen === 'name' && <NameScreen onSubmit={submitName} />}
      {screen === 'lobby' && (
        <LobbyScreen
          name={playerName}
          user={user}
          queueState={queueState}
          queuePosition={queuePosition}
          onQueue={startQueue}
          onCancelQueue={cancelQueue}
          onChangeName={() => setScreen(user ? 'auth' : 'name')}
          onOpenAccount={openAccount}
          party={party}
          onOpenSocial={openSocial}
        />
      )}
      {screen === 'account' && (
        <AccountScreen user={user} stats={stats} onBack={() => setScreen('lobby')} onLogin={() => setScreen('auth')} onLogout={logout} />
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

      <SocialPanel
        visible={socialVisible}
        onClose={closeSocial}
        user={user}
        onRequestLogin={requestLogin}
        friends={friends}
        pendingRequests={pendingRequests}
        party={party}
        partyInvite={partyInvite}
        onAddFriend={addFriend}
        onRespondRequest={respondRequest}
        onInviteToParty={inviteToParty}
        onRespondPartyInvite={respondPartyInvite}
        onLeaveParty={leaveParty}
        onStartTeamMatch={startTeamMatch}
        feedback={socialFeedback}
      />
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

function friendErrorMessage(error: string) {
  switch (error) {
    case 'user_not_found':
      return 'Utilisateur introuvable';
    case 'cannot_add_self':
      return "Tu ne peux pas t'ajouter toi-meme";
    case 'already_friends':
      return 'Deja amis';
    case 'request_already_sent':
      return 'Demande deja envoyee';
    case 'request_not_found':
      return 'Demande introuvable';
    case 'not_authenticated':
      return 'Connecte-toi pour utiliser cette fonctionnalite';
    default:
      return 'Une erreur est survenue';
  }
}

function partyErrorMessage(error: string) {
  switch (error) {
    case 'not_friends':
      return "Vous devez d'abord etre amis";
    case 'party_full':
      return 'Le groupe est complet (3 max)';
    case 'already_in_party':
      return 'Deja dans le groupe';
    case 'target_in_party':
      return 'Ce joueur est deja dans un groupe';
    case 'party_too_small':
      return 'Il faut au moins 2 joueurs dans le groupe';
    case 'member_offline':
      return 'Un membre du groupe est hors ligne';
    case 'not_authenticated':
      return 'Connecte-toi pour utiliser cette fonctionnalite';
    default:
      return 'Une erreur est survenue';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  full: { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullText: { color: '#fff', textAlign: 'center', fontSize: 16 },
});
