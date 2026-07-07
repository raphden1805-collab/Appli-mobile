const test = require('node:test');
const assert = require('node:assert/strict');
const { Match } = require('../src/match');

function makeMatch() {
  return new Match('m1', [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ]);
}

test('match starts with both players owning their town hall tile', () => {
  const match = makeMatch();
  const state = match.getState();
  assert.equal(state.players.length, 2);
  for (const player of state.players) {
    assert.equal(player.gold, 1000);
  }
  const ownedTiles = state.tiles.filter((t) => t.buildingId === 'town_hall');
  assert.equal(ownedTiles.length, 2);
});

test('match phase is countdown right after creation', () => {
  const match = makeMatch();
  const state = match.getState();
  assert.equal(state.phase, 'countdown');
  assert.ok(state.countdownRemainingMs > 0);
});

test('placing a building fails during countdown', () => {
  const match = makeMatch();
  const emptyTile = match.getState().tiles.find((t) => !t.buildingId);
  const result = match.placeBuilding('p1', emptyTile.q, emptyTile.r, 'house');
  assert.equal(result.error, 'match_not_active');
});

test('placing a building succeeds once active and deducts gold', () => {
  const match = makeMatch();
  match.activeAt = Date.now() - 1; // force le passage en phase active
  const emptyTile = match.getState().tiles.find((t) => !t.buildingId);

  const result = match.placeBuilding('p1', emptyTile.q, emptyTile.r, 'house');
  assert.deepEqual(result, { ok: true });

  const state = match.getState();
  const player = state.players.find((p) => p.id === 'p1');
  assert.equal(player.gold, 950); // 1000 - cout de la maison (50)

  const tile = state.tiles.find((t) => t.q === emptyTile.q && t.r === emptyTile.r);
  assert.equal(tile.buildingId, 'house');
  assert.equal(tile.ownerId, 'p1');
});

test('placing a building on an occupied tile fails', () => {
  const match = makeMatch();
  match.activeAt = Date.now() - 1;
  const townHallTile = match.getState().tiles.find((t) => t.buildingId === 'town_hall');
  const result = match.placeBuilding('p2', townHallTile.q, townHallTile.r, 'house');
  assert.equal(result.error, 'tile_occupied');
});

test('placing a building without enough gold fails', () => {
  const match = makeMatch();
  match.activeAt = Date.now() - 1;
  match.players.get('p1').gold = 10;
  const emptyTile = match.getState().tiles.find((t) => !t.buildingId);
  const result = match.placeBuilding('p1', emptyTile.q, emptyTile.r, 'house');
  assert.equal(result.error, 'not_enough_gold');
});

test('gold accrues over time once the match is active', () => {
  const match = makeMatch();
  match.activeAt = Date.now() - 60000; // active depuis 1 minute
  match.lastTickAt = match.activeAt;
  const state = match.tick();
  const player = state.players.find((p) => p.id === 'p1');
  // 1000 depart + 100 (revenu de la mairie) sur 1 minute
  assert.ok(player.gold >= 1099 && player.gold <= 1101, `gold inattendu: ${player.gold}`);
});

test('match finishes after its duration and picks the richest player as winner', () => {
  const match = makeMatch();
  match.activeAt = Date.now() - 10 * 60 * 1000; // tres largement depasse la duree du match
  match.lastTickAt = match.activeAt;
  match.players.get('p2').gold = 5000;
  const state = match.tick();
  assert.equal(state.finished, true);
  assert.equal(state.winnerId, 'p2');
});
