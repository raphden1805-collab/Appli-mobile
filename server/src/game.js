// Logique de combat, independante du reseau pour etre testable facilement.

const ARENA_WIDTH = 100;
const MOVE_SPEED = 3; // unites par tick
const MIN_GAP = 8; // distance minimale entre les deux combattants
const ROUND_DURATION_MS = 60000;

const ATTACKS = {
  punch: { damage: 8, range: 14, cooldownMs: 350 },
  kick: { damage: 14, range: 20, cooldownMs: 700 },
};

const BLOCK_DAMAGE_MULTIPLIER = 0.2;

function createFighter(id, name, x) {
  return {
    id,
    name,
    x,
    health: 100,
    facing: x < ARENA_WIDTH / 2 ? 1 : -1,
    isBlocking: false,
    moveIntent: 0,
    lastAction: null,
    cooldowns: { punch: 0, kick: 0 },
    ko: false,
  };
}

class FightRoom {
  constructor(roomId, player1, player2) {
    this.roomId = roomId;
    this.fighters = {
      [player1.id]: createFighter(player1.id, player1.name, 20),
      [player2.id]: createFighter(player2.id, player2.name, 80),
    };
    this.playerIds = [player1.id, player2.id];
    this.startedAt = Date.now();
    this.finished = false;
    this.winnerId = null;
  }

  otherId(playerId) {
    return this.playerIds.find((id) => id !== playerId);
  }

  applyAction(playerId, action) {
    const fighter = this.fighters[playerId];
    if (!fighter || fighter.ko || this.finished) return;

    switch (action.type) {
      case 'move_left':
        fighter.moveIntent = -1;
        break;
      case 'move_right':
        fighter.moveIntent = 1;
        break;
      case 'move_stop':
        fighter.moveIntent = 0;
        break;
      case 'block_start':
        fighter.isBlocking = true;
        break;
      case 'block_stop':
        fighter.isBlocking = false;
        break;
      case 'punch':
      case 'kick':
        this._tryAttack(playerId, action.type);
        break;
      default:
        break;
    }
  }

  _tryAttack(playerId, attackType) {
    const attacker = this.fighters[playerId];
    const now = Date.now();
    if (attacker.isBlocking) return;
    if (now < attacker.cooldowns[attackType]) return;

    const spec = ATTACKS[attackType];
    attacker.cooldowns[attackType] = now + spec.cooldownMs;
    attacker.lastAction = attackType;

    const defenderId = this.otherId(playerId);
    const defender = this.fighters[defenderId];
    const distance = Math.abs(attacker.x - defender.x);

    if (distance <= spec.range) {
      const damage = defender.isBlocking ? spec.damage * BLOCK_DAMAGE_MULTIPLIER : spec.damage;
      defender.health = Math.max(0, defender.health - damage);
      if (defender.health <= 0) {
        defender.ko = true;
        this.finished = true;
        this.winnerId = playerId;
      }
    }
  }

  tick() {
    if (this.finished) return this.getState();

    const [p1, p2] = this.playerIds.map((id) => this.fighters[id]);
    const wasP1OnLeft = p1.x <= p2.x;

    const rawX1 = p1.x + p1.moveIntent * MOVE_SPEED;
    const rawX2 = p2.x + p2.moveIntent * MOVE_SPEED;
    let leftX = wasP1OnLeft ? rawX1 : rawX2;
    let rightX = wasP1OnLeft ? rawX2 : rawX1;

    // Empeche les combattants de se traverser / se depasser.
    if (rightX - leftX < MIN_GAP) {
      const mid = (leftX + rightX) / 2;
      leftX = mid - MIN_GAP / 2;
      rightX = mid + MIN_GAP / 2;
    }
    // Repousse la paire (en conservant l'ecart minimal) si elle deborde de l'arene.
    if (rightX > ARENA_WIDTH) {
      const shift = rightX - ARENA_WIDTH;
      rightX -= shift;
      leftX -= shift;
    }
    if (leftX < 0) {
      const shift = -leftX;
      leftX += shift;
      rightX += shift;
    }

    p1.x = wasP1OnLeft ? leftX : rightX;
    p2.x = wasP1OnLeft ? rightX : leftX;
    p1.facing = p1.x <= p2.x ? 1 : -1;
    p2.facing = p2.x <= p1.x ? 1 : -1;

    const elapsed = Date.now() - this.startedAt;
    if (elapsed >= ROUND_DURATION_MS && !this.finished) {
      this.finished = true;
      if (p1.health === p2.health) {
        this.winnerId = null; // egalite
      } else {
        this.winnerId = p1.health > p2.health ? p1.id : p2.id;
      }
    }

    return this.getState();
  }

  getState() {
    const elapsed = Date.now() - this.startedAt;
    return {
      roomId: this.roomId,
      fighters: this.playerIds.map((id) => {
        const f = this.fighters[id];
        return {
          id: f.id,
          name: f.name,
          x: f.x,
          health: f.health,
          facing: f.facing,
          isBlocking: f.isBlocking,
          lastAction: f.lastAction,
          ko: f.ko,
        };
      }),
      timeRemainingMs: Math.max(0, ROUND_DURATION_MS - elapsed),
      finished: this.finished,
      winnerId: this.winnerId,
    };
  }
}

module.exports = { FightRoom, ATTACKS, ARENA_WIDTH, ROUND_DURATION_MS };
