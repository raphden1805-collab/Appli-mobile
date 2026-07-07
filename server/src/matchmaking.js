const MAX_PLAYERS = 8;

class Matchmaking {
  constructor() {
    this.queue = [];
    this.connectedCount = 0;
  }

  canAcceptNewConnection() {
    return this.connectedCount < MAX_PLAYERS;
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

  tryMatch() {
    if (this.queue.length >= 2) {
      const player1 = this.queue.shift();
      const player2 = this.queue.shift();
      return [player1, player2];
    }
    return null;
  }
}

module.exports = { Matchmaking, MAX_PLAYERS };
