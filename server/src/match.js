const { hexKey, generateIsland, startingPositions } = require('./hexGrid');
const { BUILDING_CATALOG } = require('./buildings');

const ISLAND_RADIUS = 6;
const MAX_PLAYERS_PER_MATCH = 10;
const STARTING_GOLD = 1000;
const COUNTDOWN_MS = 6000;
const MATCH_DURATION_MS = 5 * 60 * 1000;
const TOWN_HALL_INCOME_PER_MIN = 100;

const TEAM_COLORS = ['#ef5350', '#66bb6a', '#ffa726', '#42a5f5', '#ab47bc', '#ffee58', '#26c6da', '#8d6e63', '#ec407a', '#78909c'];

function createNation(members, slotIndex, startHex) {
  return {
    nationId: members[0].id,
    members: members.map((m) => ({ id: m.id, name: m.name, connected: true })),
    color: TEAM_COLORS[slotIndex % TEAM_COLORS.length],
    startHex,
    gold: STARTING_GOLD,
    incomePerMin: TOWN_HALL_INCOME_PER_MIN,
  };
}

class Match {
  // `groups` est un tableau de groupes ; chaque groupe est un tableau de
  // {id, name} qui partagent une seule nation (empire commun). Un joueur
  // solo est simplement un groupe d'une seule personne.
  constructor(matchId, groups) {
    this.matchId = matchId;
    this.tiles = new Map();
    for (const { q, r } of generateIsland(ISLAND_RADIUS)) {
      this.tiles.set(hexKey(q, r), { q, r, ownerId: null, buildingId: null });
    }

    const slots = startingPositions(ISLAND_RADIUS, MAX_PLAYERS_PER_MATCH);
    this.nations = new Map();
    this.memberToNation = new Map();

    groups.forEach((members, index) => {
      const startHex = slots[index];
      const nation = createNation(members, index, startHex);
      this.nations.set(nation.nationId, nation);
      for (const m of members) this.memberToNation.set(m.id, nation.nationId);

      const tile = this.tiles.get(hexKey(startHex.q, startHex.r));
      if (tile) {
        tile.ownerId = nation.nationId;
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
    return [...this.memberToNation.keys()];
  }

  get isTeamMatch() {
    return this.nations.size === 1 && this.nations.values().next().value.members.length > 1;
  }

  placeBuilding(playerId, q, r, buildingTypeId) {
    const now = Date.now();
    if (this.finished || now < this.activeAt) return { error: 'match_not_active' };

    const nationId = this.memberToNation.get(playerId);
    const nation = nationId && this.nations.get(nationId);
    if (!nation) return { error: 'unknown_player' };

    const building = BUILDING_CATALOG[buildingTypeId];
    if (!building) return { error: 'unknown_building' };

    const tile = this.tiles.get(hexKey(q, r));
    if (!tile) return { error: 'invalid_tile' };
    if (tile.buildingId) return { error: 'tile_occupied' };
    if (nation.gold < building.cost) return { error: 'not_enough_gold' };

    nation.gold -= building.cost;
    tile.ownerId = nation.nationId;
    tile.buildingId = buildingTypeId;
    this._recomputeIncome(nation.nationId);
    return { ok: true };
  }

  _recomputeIncome(nationId) {
    let income = TOWN_HALL_INCOME_PER_MIN;
    for (const tile of this.tiles.values()) {
      if (tile.ownerId === nationId && tile.buildingId && tile.buildingId !== 'town_hall') {
        income += BUILDING_CATALOG[tile.buildingId].incomePerMin;
      }
    }
    this.nations.get(nationId).incomePerMin = income;
  }

  removePlayer(playerId) {
    const nationId = this.memberToNation.get(playerId);
    const nation = nationId && this.nations.get(nationId);
    if (!nation) return;
    const member = nation.members.find((m) => m.id === playerId);
    if (member) member.connected = false;
  }

  tick() {
    const now = Date.now();
    if (this.finished) return this.getState();

    if (now >= this.activeAt) {
      const deltaMs = now - Math.max(this.lastTickAt, this.activeAt);
      if (deltaMs > 0) {
        for (const nation of this.nations.values()) {
          nation.gold += (nation.incomePerMin * deltaMs) / 60000;
        }
      }

      if (now - this.activeAt >= MATCH_DURATION_MS) {
        this.finished = true;
        let best = null;
        for (const nation of this.nations.values()) {
          if (!best || nation.gold > best.gold) best = nation;
        }
        this.winnerId = best ? best.nationId : null;
      }
    }

    this.lastTickAt = now;
    return this.getState();
  }

  getState() {
    const now = Date.now();
    const countdownRemainingMs = Math.max(0, this.activeAt - now);
    const elapsedActiveMs = Math.max(0, now - this.activeAt);

    const players = [];
    for (const nation of this.nations.values()) {
      for (const member of nation.members) {
        players.push({
          id: member.id,
          name: member.name,
          nationId: nation.nationId,
          color: nation.color,
          gold: Math.floor(nation.gold),
          incomePerMin: nation.incomePerMin,
          connected: member.connected,
        });
      }
    }

    return {
      matchId: this.matchId,
      phase: this.finished ? 'finished' : countdownRemainingMs > 0 ? 'countdown' : 'active',
      countdownRemainingMs,
      timeRemainingMs: Math.max(0, MATCH_DURATION_MS - elapsedActiveMs),
      finished: this.finished,
      winnerId: this.winnerId,
      isTeamMatch: this.isTeamMatch,
      players,
      tiles: [...this.tiles.values()],
    };
  }
}

module.exports = { Match, ISLAND_RADIUS, MAX_PLAYERS_PER_MATCH, MATCH_DURATION_MS };
