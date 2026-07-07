const test = require('node:test');
const assert = require('node:assert/strict');
const { FightRoom } = require('../src/game');

function makeRoom() {
  return new FightRoom('room-1', { id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' });
}

test('punch out of range deals no damage', () => {
  const room = makeRoom();
  room.applyAction('p1', { type: 'punch' });
  const state = room.tick();
  assert.equal(state.fighters[1].health, 100);
});

test('punch within range deals damage', () => {
  const room = makeRoom();
  room.fighters.p1.x = 40;
  room.fighters.p2.x = 50;
  room.applyAction('p1', { type: 'punch' });
  const state = room.tick();
  assert.equal(state.fighters[1].health, 92);
});

test('blocking reduces incoming damage', () => {
  const room = makeRoom();
  room.fighters.p1.x = 40;
  room.fighters.p2.x = 50;
  room.applyAction('p2', { type: 'block_start' });
  room.applyAction('p1', { type: 'punch' });
  const state = room.tick();
  assert.equal(state.fighters[1].health, 98.4);
});

test('attack respects cooldown', () => {
  const room = makeRoom();
  room.fighters.p1.x = 40;
  room.fighters.p2.x = 50;
  room.applyAction('p1', { type: 'punch' });
  room.tick();
  room.applyAction('p1', { type: 'punch' });
  const state = room.tick();
  assert.equal(state.fighters[1].health, 92, 'second punch should be blocked by cooldown');
});

test('fighters cannot pass through each other', () => {
  const room = makeRoom();
  room.applyAction('p1', { type: 'move_right' });
  for (let i = 0; i < 50; i += 1) room.tick();
  const state = room.getState();
  const [f1, f2] = state.fighters;
  assert.ok(f1.x < f2.x, 'p1 should stay left of p2');
  assert.ok(f2.x - f1.x >= 7.9, 'minimum gap should be enforced');
});

test('KO ends the fight with a winner', () => {
  const room = makeRoom();
  room.fighters.p1.x = 40;
  room.fighters.p2.x = 50;
  room.fighters.p2.health = 5;
  room.applyAction('p1', { type: 'punch' });
  const state = room.tick();
  assert.equal(state.finished, true);
  assert.equal(state.winnerId, 'p1');
  assert.equal(state.fighters[1].ko, true);
});
