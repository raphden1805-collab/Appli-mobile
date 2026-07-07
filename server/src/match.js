const { hexKey, generateIsland, startingPositions } = require('./hexGrid');
const { BUILDING_CATALOG } = require('./buildings');

const ISLAND_RADIUS = 6;
const MAX_PLAYERS_PER_MATCH = 10;
const STARTING_GOLD = 1000;
const COUNTDOWN_MS = 6000;
const MATCH_DURATION_MS = 5 * 60 * 1000;
const TOWN_HALL_INCOME_PER_MIN = 100;

const TEAM_COLORS = ['#ef5350', '#66bb6a', '#ffa726', '#42a5f5', '#ab47bc', '#ffee58', '#26c6da', '#8d6e63', '#ec407a', '#78909c'];

function createPlayer(id, name, slotIndex, startHex) {
  return {
    id,
    name,
    color: TEAM_COLORS[slotIndex % TEAM_COLORS.length],
    startHex,
    gold: STARTING_GOLD,
    incomePerMin: TOWN_HALL_INCOME_PER_MIN,
    connected: true,
  };
}

class Match {
  constructor(matchId, players) {
    this.matchId = matchId;
    this.tiles = new Map();
    for (const { q, r } of generateIsland(ISLAND_RADIUS)) {
      this.tiles.set(hexKey(q, r), { q, r, ownerId: null, buildingId: null });
    }

    const slots = startingPositions(ISLAND_RADIUS, MAX_PLAYERS_PER_MATCH);
    this.players = new Map();
    players.forEach((p, index) => {
      const startHex = slots[index];
      const player = createPlayer(p.id, p.name, index, startHex);
      this.players.set(p.id, player);
      const tile = this.tiles.get(hexKey(startHex.q, startHex.r));
      if (tile) {
        tile.ownerId = p.id;
        tile.buildingId = 'town_hall';
      }
    });

    this.createdAt = Date.now();
    this.activeAt = this.createdAt + COUNTDOWN_MS;
    this.finished = false;
    this.winnerId = null;
    this.lastTickAt = this.createdAt;
  }

  get playerIds() {
    return [...this.players.keys()];
  }

  placeBuilding(playerId, q, r, buildingTypeId) {
    const now = Date.now();
    if (this.finished || now < this.activeAt) return { error: 'match_not_active' };

    const player = this.players.get(playerId);
    if (!player) return { error: 'unknown_player' };

    const building = BUILDING_CATALOG[buildingTypeId];
    if (!building) return { error: 'unknown_building' };

    const tile = this.tiles.get(hexKey(q, r));
    if (!tile) return { error: 'invalid_tile' };
    if (tile.buildingId) return { error: 'tile_occupied' };
    if (player.gold < building.cost) return { error: 'not_enough_gold' };

    player.gold -= building.cost;
    tile.ownerId = playerId;
    tile.buildingId = buildingTypeId;
    this._recomputeIncome(playerId);
    return { ok: true };
  }

  _recomputeIncome(playerId) {
    let income = TOWN_HALL_INCOME_PER_MIN;
    for (const tile of this.tiles.values()) {
      if (tile.ownerId === playerId && tile.buildingId && tile.buildingId !== 'town_hall') {
        income += BUILDING_CATALOG[tile.buildingId].incomePerMin;
      }
    }
    this.players.get(playerId).incomePerMin = income;
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) player.connected = false;
  }

  tick() {
    const now = Date.now();
    if (this.finished) return this.getState();

    if (now >= this.activeAt) {
      const deltaMs = now - Math.max(this.lastTickAt, this.activeAt);
      if (deltaMs > 0) {
        for (const player of this.players.values()) {
          player.gold += (player.incomePerMin * deltaMs) / 60000;
        }
      }

      if (now - this.activeAt >= MATCH_DURATION_MS) {
        this.finished = true;
        let best = null;
        for (const player of this.players.values()) {
          if (!best || player.gold > best.gold) best = player;
        }
        this.winnerId = best ? best.id : null;
      }
    }

    this.lastTickAt = now;
    return this.getState();
  }

  getState() {
    const now = Date.now();
    const countdownRemainingMs = Math.max(0, this.activeAt - now);
    const elapsedActiveMs = Math.max(0, now - this.activeAt);
    return {
      matchId: this.matchId,
      phase: this.finished ? 'finished' : countdownRemainingMs > 0 ? 'countdown' : 'active',
      countdownRemainingMs,
      timeRemainingMs: Math.max(0, MATCH_DURATION_MS - elapsedActiveMs),
      finished: this.finished,
      winnerId: this.winnerId,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        gold: Math.floor(p.gold),
        incomePerMin: p.incomePerMin,
        connected: p.connected,
      })),
      tiles: [...this.tiles.values()],
    };
  }
}

module.exports = { Match, ISLAND_RADIUS, MAX_PLAYERS_PER_MATCH, MATCH_DURATION_MS };
