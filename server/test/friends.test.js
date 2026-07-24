process.env.DB_PATH = ':memory:';

const test = require('node:test');
const assert = require('node:assert/strict');
const auth = require('../src/auth');
const friends = require('../src/friends');

function makeUser(name) {
  return auth.register(name, 'password123').user;
}

test('sending a friend request creates a pending request for the target', () => {
  const alice = makeUser('alice_fr');
  const bob = makeUser('bob_fr');

  const result = friends.sendFriendRequest(alice.id, 'bob_fr');
  assert.deepEqual(result.ok, true);
  assert.equal(result.autoAccepted, false);

  const pending = friends.listPendingRequests(bob.id);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].from.username, 'alice_fr');
});

test('accepting a request makes both users friends', () => {
  const alice = makeUser('alice_fr2');
  const bob = makeUser('bob_fr2');
  friends.sendFriendRequest(alice.id, 'bob_fr2');
  const pending = friends.listPendingRequests(bob.id);

  friends.respondFriendRequest(pending[0].requestId, bob.id, true);

  assert.equal(friends.areFriends(alice.id, bob.id), true);
  assert.deepEqual(
    friends.listFriends(alice.id).map((f) => f.username),
    ['bob_fr2']
  );
});

test('declining a request does not create a friendship', () => {
  const alice = makeUser('alice_fr3');
  const bob = makeUser('bob_fr3');
  friends.sendFriendRequest(alice.id, 'bob_fr3');
  const pending = friends.listPendingRequests(bob.id);

  friends.respondFriendRequest(pending[0].requestId, bob.id, false);

  assert.equal(friends.areFriends(alice.id, bob.id), false);
});

test('a reverse request auto-accepts instead of creating a duplicate', () => {
  const alice = makeUser('alice_fr4');
  const bob = makeUser('bob_fr4');
  friends.sendFriendRequest(alice.id, 'bob_fr4');

  const result = friends.sendFriendRequest(bob.id, 'alice_fr4');
  assert.equal(result.autoAccepted, true);
  assert.equal(friends.areFriends(alice.id, bob.id), true);
});

test('cannot add yourself or an unknown user', () => {
  const alice = makeUser('alice_fr5');
  assert.equal(friends.sendFriendRequest(alice.id, 'alice_fr5').error, 'cannot_add_self');
  assert.equal(friends.sendFriendRequest(alice.id, 'nobody_here').error, 'user_not_found');
});

test('sending the same request twice is rejected', () => {
  const alice = makeUser('alice_fr6');
  makeUser('bob_fr6');
  friends.sendFriendRequest(alice.id, 'bob_fr6');
  assert.equal(friends.sendFriendRequest(alice.id, 'bob_fr6').error, 'request_already_sent');
});
