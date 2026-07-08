const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { randomUUID } = require('crypto');

const { Match, ISLAND_RADIUS } = require('./match');
const { Matchmaking, SERVER_CAPACITY } = require('./matchmaking');
const { BUILDING_CATALOG } = require('./buildings');
const auth = require('./auth');
const friends = require('./friends');
const party = require('./party');

const PORT = process.env.PORT || 3000;
const TICK_RATE_MS = 1000;

const app = express();
app.use(cors());
app.get('/health', (req, res) => {
  res.json({ ok: true, connected: matchmaking.connectedCount, capacity: SERVER_CAPACITY, activeMatches: matches.size });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const matchmaking = new Matchmaking();
const matches = new Map(); // matchId -> Match
const socketToMatch = new Map(); // socketId -> matchId

const socketUser = new Map(); // socketId -> { id, username }
const onlineSockets = new Map(); // userId -> socketId

function tryStartMatch() {
  const players = matchmaking.tryStartMatch();
  if (!players) return;
  createMatch(players.map((p) => [p]));
}

function createMatch(groups) {
  const matchId = randomUUID();
  const match = new Match(matchId, groups);
  matches.set(matchId, match);

  for (const playerId of match.playerIds) {
    socketToMatch.set(playerId, matchId);
    io.sockets.sockets.get(playerId)?.join(matchId);
  }
  io.to(matchId).emit('match_found', { matchId, islandRadius: ISLAND_RADIUS, state: match.getState() });
}

function friendsPayload(userId) {
  return {
    friends: friends.listFriends(userId).map((f) => ({ ...f, online: onlineSockets.has(f.id) })),
    pending: friends.listPendingRequests(userId),
  };
}

function sendFriendsUpdate(userId) {
  const socketId = onlineSockets.get(userId);
  if (socketId) io.to(socketId).emit('friends_list', friendsPayload(userId));
}

function partyPayload(partyState) {
  if (!partyState) return { members: [] };
  return {
    partyId: partyState.id,
    members: partyState.members.map((m) => ({ id: m.id, username: m.username, online: onlineSockets.has(m.id) })),
  };
}

function sendPartyUpdate(partyState) {
  if (!partyState) return;
  for (const member of partyState.members) {
    const socketId = onlineSockets.get(member.id);
    if (socketId) io.to(socketId).emit('party_state', partyPayload(partyState));
  }
}

function attachAuthenticatedUser(socket, user) {
  socketUser.set(socket.id, user);
  onlineSockets.set(user.id, socket.id);
  party.updateSocket(user.id, socket.id);

  socket.emit('auth_ok', { user });
  sendFriendsUpdate(user.id);

  const existingParty = party.getParty(user.id);
  if (existingParty) socket.emit('party_state', partyPayload(existingParty));

  for (const friend of friends.listFriends(user.id)) sendFriendsUpdate(friend.id);
}

function requireAuth(socket, callback) {
  const user = socketUser.get(socket.id);
  if (!user) {
    callback?.({ error: 'not_authenticated' });
    return null;
  }
  return user;
}

io.on('connection', (socket) => {
  if (!matchmaking.canAcceptNewConnection()) {
    socket.emit('server_full');
    socket.disconnect(true);
    return;
  }
  matchmaking.registerConnection();
  socket.emit('building_catalog', BUILDING_CATALOG);

  // --- Comptes ---
  socket.on('register', ({ username, password } = {}, callback) => {
    const result = auth.register(username, password);
    if (result.error) return callback?.(result);
    attachAuthenticatedUser(socket, result.user);
    callback?.({ ok: true, user: result.user, token: result.token });
  });

  socket.on('login', ({ username, password } = {}, callback) => {
    const result = auth.login(username, password);
    if (result.error) return callback?.(result);
    attachAuthenticatedUser(socket, result.user);
    callback?.({ ok: true, user: result.user, token: result.token });
  });

  socket.on('resume_session', ({ token } = {}, callback) => {
    const user = auth.resumeSession(token);
    if (!user) return callback?.({ error: 'invalid_session' });
    attachAuthenticatedUser(socket, user);
    callback?.({ ok: true, user });
  });

  socket.on('logout', (_, callback) => {
    const user = socketUser.get(socket.id);
    if (user) {
      socketUser.delete(socket.id);
      if (onlineSockets.get(user.id) === socket.id) {
        onlineSockets.delete(user.id);
        for (const friend of friends.listFriends(user.id)) sendFriendsUpdate(friend.id);
      }
    }
    callback?.({ ok: true });
  });

  // --- Amis ---
  socket.on('friend_request_send', ({ username } = {}, callback) => {
    const user = requireAuth(socket, callback);
    if (!user) return;
    const result = friends.sendFriendRequest(user.id, username);
    if (result.error) return callback?.(result);
    callback?.({ ok: true });
    sendFriendsUpdate(user.id);
    const target = result.target || result.friend;
    if (target) sendFriendsUpdate(target.id);
  });

  socket.on('friend_request_respond', ({ requestId, accept } = {}, callback) => {
    const user = requireAuth(socket, callback);
    if (!user) return;
    const result = friends.respondFriendRequest(requestId, user.id, Boolean(accept));
    if (result.error) return callback?.(result);
    callback?.({ ok: true });
    sendFriendsUpdate(user.id);
    sendFriendsUpdate(result.fromUserId);
  });

  socket.on('friends_list_request', (_, callback) => {
    const user = requireAuth(socket, callback);
    if (!user) return;
    callback?.({ ok: true, ...friendsPayload(user.id) });
  });

  // --- Groupe (party) ---
  socket.on('party_invite', ({ username } = {}, callback) => {
    const user = requireAuth(socket, callback);
    if (!user) return;
    const target = auth.getUserByUsername(username);
    if (!target) return callback?.({ error: 'user_not_found' });
    if (!friends.areFriends(user.id, target.id)) return callback?.({ error: 'not_friends' });

    const result = party.invite(user, target);
    if (result.error) return callback?.(result);
    callback?.({ ok: true });
    sendPartyUpdate(result.party);
    const targetSocketId = onlineSockets.get(target.id);
    if (targetSocketId) io.to(targetSocketId).emit('party_invite_received', { fromUsername: user.username });
  });

  socket.on('party_invite_respond', ({ accept } = {}, callback) => {
    const user = requireAuth(socket, callback);
    if (!user) return;
    const result = party.respondInvite(user, Boolean(accept));
    if (result.error) return callback?.(result);
    callback?.({ ok: true });
    if (result.party) sendPartyUpdate(result.party);
    else socket.emit('party_state', partyPayload(null));
  });

  socket.on('party_leave', (_, callback) => {
    const user = requireAuth(socket, callback);
    if (!user) return;
    const remaining = party.leaveParty(user.id);
    callback?.({ ok: true });
    socket.emit('party_state', partyPayload(null));
    if (remaining) sendPartyUpdate(remaining);
  });

  socket.on('start_team_match', (_, callback) => {
    const user = requireAuth(socket, callback);
    if (!user) return;
    const currentParty = party.getParty(user.id);
    if (!currentParty || currentParty.members.length < 2) {
      return callback?.({ error: 'party_too_small' });
    }
    const offlineMember = currentParty.members.find((m) => !onlineSockets.has(m.id));
    if (offlineMember) return callback?.({ error: 'member_offline' });

    const groups = [currentParty.members.map((m) => ({ id: onlineSockets.get(m.id), name: m.username }))];
    party.disband(currentParty.id);
    createMatch(groups);
    callback?.({ ok: true });
  });

  // --- Partie solo (file d'attente classique) ---
  socket.on('join_queue', ({ name } = {}) => {
    const authedUser = socketUser.get(socket.id);
    const cleanName = (authedUser?.username || name || 'Joueur').toString().slice(0, 20);
    matchmaking.enqueue({ id: socket.id, name: cleanName });
    socket.emit('queued', { position: matchmaking.queue.length });
    tryStartMatch();
  });

  socket.on('leave_queue', () => {
    matchmaking.removeFromQueue(socket.id);
  });

  socket.on('place_building', ({ q, r, buildingTypeId } = {}) => {
    const matchId = socketToMatch.get(socket.id);
    if (!matchId) return;
    const match = matches.get(matchId);
    if (!match) return;
    const result = match.placeBuilding(socket.id, q, r, buildingTypeId);
    if (result.error) socket.emit('place_building_rejected', result);
  });

  socket.on('leave_match', () => {
    socketToMatch.delete(socket.id);
  });

  socket.on('disconnect', () => {
    matchmaking.releaseConnection();
    matchmaking.removeFromQueue(socket.id);

    const matchId = socketToMatch.get(socket.id);
    if (matchId) {
      const match = matches.get(matchId);
      if (match) match.removePlayer(socket.id);
      socketToMatch.delete(socket.id);
    }

    const user = socketUser.get(socket.id);
    if (user) {
      socketUser.delete(socket.id);
      if (onlineSockets.get(user.id) === socket.id) {
        onlineSockets.delete(user.id);
        for (const friend of friends.listFriends(user.id)) sendFriendsUpdate(friend.id);
      }
    }
  });
});

setInterval(() => {
  for (const [matchId, match] of matches.entries()) {
    const state = match.tick();
    io.to(matchId).emit('state_update', state);
    if (state.finished) {
      for (const playerId of match.playerIds) socketToMatch.delete(playerId);
      matches.delete(matchId);
    }
  }
}, TICK_RATE_MS);

server.listen(PORT, () => {
  console.log(`Strategy server listening on port ${PORT}`);
});

module.exports = { app, server, io };
