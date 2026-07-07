const { MAX_PLAYERS_PER_MATCH } = require('./match');

const MIN_PLAYERS_TO_START = 2;
const SERVER_CAPACITY = 40; // joueurs connectes simultanement (plusieurs parties en parallele)

class Matchmaking {
  constructor() {
    this.queue = [];
    this.connectedCount = 0;
  }

  canAcceptNewConnection() {
    return this.connectedCount < SERVER_CAPACITY;
  }

  registerConnection() {
    this.connectedCount += 1;
  }

  releaseConnection() {
    this.connectedCount = Math.max(0, this.connectedCount - 1);
  }

  enqueue(player) {
    this.queue.push(player);
  }

  removeFromQueue(playerId) {
    this.queue = this.queue.filter((p) => p.id !== playerId);
  }

  tryStartMatch() {
    if (this.queue.length < MIN_PLAYERS_TO_START) return null;
    const group = this.queue.splice(0, MAX_PLAYERS_PER_MATCH);
    return group;
  }
}

module.exports = { Matchmaking, MIN_PLAYERS_TO_START, SERVER_CAPACITY };
