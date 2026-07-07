const test = require('node:test');
const assert = require('node:assert/strict');
const party = require('../src/party');

function user(id, username) {
  return { id, username, socketId: `sock-${id}` };
}

test('inviting a friend creates a party and a pending invite', () => {
  const alice = user(101, 'alice_p');
  const bob = user(102, 'bob_p');

  const result = party.invite(alice, bob);
  assert.equal(result.ok, true);
  assert.equal(result.party.members.length, 1);

  const pending = party.getPendingInviteFor(bob.id);
  assert.equal(pending.fromUsername, 'alice_p');
});

test('accepting an invite adds the member to the party', () => {
  const alice = user(103, 'alice_p2');
  const bob = user(104, 'bob_p2');
  party.invite(alice, bob);

  const result = party.respondInvite(bob, true);
  assert.equal(result.ok, true);
  assert.equal(result.party.members.length, 2);
  assert.deepEqual(party.getParty(alice.id).id, party.getParty(bob.id).id);
});

test('declining an invite does not join the party', () => {
  const alice = user(105, 'alice_p3');
  const bob = user(106, 'bob_p3');
  party.invite(alice, bob);

  const result = party.respondInvite(bob, false);
  assert.equal(result.declined, true);
  assert.equal(party.getParty(bob.id), null);
});

test('a party cannot exceed 3 members', () => {
  const alice = user(107, 'alice_p4');
  const bob = user(108, 'bob_p4');
  const carol = user(109, 'carol_p4');
  const dave = user(110, 'dave_p4');

  party.invite(alice, bob);
  party.respondInvite(bob, true);
  party.invite(alice, carol);
  party.respondInvite(carol, true);

  const result = party.invite(alice, dave);
  assert.equal(result.error, 'party_full');
});

test('leaving a party removes the member and disbands empty parties', () => {
  const alice = user(111, 'alice_p5');
  const bob = user(112, 'bob_p5');
  party.invite(alice, bob);
  party.respondInvite(bob, true);

  party.leaveParty(bob.id);
  assert.equal(party.getParty(bob.id), null);
  assert.equal(party.getParty(alice.id).members.length, 1);

  party.leaveParty(alice.id);
  assert.equal(party.getParty(alice.id), null);
});

test('cannot invite someone already in a party', () => {
  const alice = user(113, 'alice_p6');
  const bob = user(114, 'bob_p6');
  const carol = user(115, 'carol_p6');

  party.invite(alice, bob);
  party.respondInvite(bob, true);

  const result = party.invite(carol, bob);
  assert.equal(result.error, 'target_in_party');
});
