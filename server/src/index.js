const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { randomUUID } = require('crypto');

const { Match, ISLAND_RADIUS } = require('./match');
const { Matchmaking, SERVER_CAPACITY } = require('./matchmaking');
const { BUILDING_CATALOG } = require('./buildings');

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

function tryStartMatch() {
  const group = matchmaking.tryStartMatch();
  if (!group) return;

  const matchId = randomUUID();
  const match = new Match(matchId, group);
  matches.set(matchId, match);

  for (const playerId of match.playerIds) {
    socketToMatch.set(playerId, matchId);
    io.sockets.sockets.get(playerId)?.join(matchId);
  }
  io.to(matchId).emit('match_found', { matchId, islandRadius: ISLAND_RADIUS, state: match.getState() });
}

io.on('connection', (socket) => {
  if (!matchmaking.canAcceptNewConnection()) {
    socket.emit('server_full');
    socket.disconnect(true);
    return;
  }
  matchmaking.registerConnection();
  socket.emit('building_catalog', BUILDING_CATALOG);

  socket.on('join_queue', ({ name }) => {
    const cleanName = (name || 'Joueur').toString().slice(0, 20);
    matchmaking.enqueue({ id: socket.id, name: cleanName });
    socket.emit('queued', { position: matchmaking.queue.length });
    tryStartMatch();
  });

  socket.on('leave_queue', () => {
    matchmaking.removeFromQueue(socket.id);
  });

  socket.on('place_building', ({ q, r, buildingTypeId }) => {
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
