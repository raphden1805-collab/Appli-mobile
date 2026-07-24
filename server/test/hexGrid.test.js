const test = require('node:test');
const assert = require('node:assert/strict');
const { generateIsland, hexDistance, neighbors, startingPositions } = require('../src/hexGrid');

test('generateIsland produces the expected hex count for a given radius', () => {
  const radius = 3;
  const tiles = generateIsland(radius);
  assert.equal(tiles.length, 3 * radius * radius + 3 * radius + 1);
});

test('every generated tile is within the radius from center', () => {
  const radius = 4;
  const tiles = generateIsland(radius);
  for (const tile of tiles) {
    assert.ok(hexDistance({ q: 0, r: 0 }, tile) <= radius);
  }
});

test('neighbors returns 6 adjacent hexes at distance 1', () => {
  const center = { q: 2, r: -1 };
  const adj = neighbors(center);
  assert.equal(adj.length, 6);
  for (const n of adj) {
    assert.equal(hexDistance(center, n), 1);
  }
});

test('startingPositions returns one unique position per player, all within the island', () => {
  const radius = 6;
  const positions = startingPositions(radius, 10);
  assert.equal(positions.length, 10);
  for (const pos of positions) {
    assert.ok(hexDistance({ q: 0, r: 0 }, pos) <= radius);
  }
  const unique = new Set(positions.map((p) => `${p.q},${p.r}`));
  assert.equal(unique.size, positions.length, 'starting positions should not collide');
});
