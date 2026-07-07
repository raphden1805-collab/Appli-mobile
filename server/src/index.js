const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { randomUUID } = require('crypto');

const { FightRoom } = require('./game');
const { Matchmaking, MAX_PLAYERS } = require('./matchmaking');

const PORT = process.env.PORT || 3000;
const TICK_RATE_MS = 1000 / 20;

const app = express();
app.use(cors());
app.get('/health', (req, res) => {
  res.json({ ok: true, connected: matchmaking.connectedCount, maxPlayers: MAX_PLAYERS });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const matchmaking = new Matchmaking();
const rooms = new Map(); // roomId -> FightRoom
const socketToRoom = new Map(); // socketId -> roomId

function broadcastQueueMatch() {
  const match = matchmaking.tryMatch();
  if (!match) return;

  const [player1, player2] = match;
  const roomId = randomUUID();
  const room = new FightRoom(roomId, player1, player2);
  rooms.set(roomId, room);
  socketToRoom.set(player1.id, roomId);
  socketToRoom.set(player2.id, roomId);

  const state = room.getState();
  io.to(player1.id).emit('match_found', { roomId, you: player1.id, opponentName: player2.name, state });
  io.to(player2.id).emit('match_found', { roomId, you: player2.id, opponentName: player1.name, state });
}

io.on('connection', (socket) => {
  if (!matchmaking.canAcceptNewConnection()) {
    socket.emit('server_full', { maxPlayers: MAX_PLAYERS });
    socket.disconnect(true);
    return;
  }
  matchmaking.registerConnection();

  socket.on('join_queue', ({ name }) => {
    const cleanName = (name || 'Combattant').toString().slice(0, 20);
    matchmaking.enqueue({ id: socket.id, name: cleanName });
    socket.emit('queued', { position: matchmaking.queue.length });
    broadcastQueueMatch();
  });

  socket.on('leave_queue', () => {
    matchmaking.removeFromQueue(socket.id);
  });

  socket.on('action', (action) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.applyAction(socket.id, action);
  });

  socket.on('rematch', () => {
    socketToRoom.delete(socket.id);
  });

  socket.on('disconnect', () => {
    matchmaking.releaseConnection();
    matchmaking.removeFromQueue(socket.id);

    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        const opponentId = room.otherId(socket.id);
        io.to(opponentId).emit('opponent_left');
        rooms.delete(roomId);
      }
      socketToRoom.delete(socket.id);
    }
  });
});

setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    const state = room.tick();
    io.to(room.playerIds[0]).to(room.playerIds[1]).emit('state_update', state);
    if (state.finished) {
      rooms.delete(roomId);
      socketToRoom.delete(room.playerIds[0]);
      socketToRoom.delete(room.playerIds[1]);
    }
  }
}, TICK_RATE_MS);

server.listen(PORT, () => {
  console.log(`Fight server listening on port ${PORT}`);
});

module.exports = { app, server, io };
