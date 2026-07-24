process.env.DB_PATH = ':memory:';

const test = require('node:test');
const assert = require('node:assert/strict');
const auth = require('../src/auth');

test('register creates a user and a valid session', () => {
  const result = auth.register('alice_auth', 'password123');
  assert.equal(result.error, undefined);
  assert.equal(result.user.username, 'alice_auth');
  const resumed = auth.resumeSession(result.token);
  assert.equal(resumed.id, result.user.id);
});

test('register rejects invalid usernames', () => {
  assert.equal(auth.register('a', 'password123').error, 'invalid_username');
  assert.equal(auth.register('has space', 'password123').error, 'invalid_username');
});

test('register rejects short passwords', () => {
  assert.equal(auth.register('bob_auth', 'abc').error, 'invalid_password');
});

test('register rejects duplicate usernames (case-insensitive)', () => {
  auth.register('carol_auth', 'password123');
  assert.equal(auth.register('Carol_Auth', 'password123').error, 'username_taken');
});

test('login succeeds with correct credentials and fails otherwise', () => {
  auth.register('dave_auth', 'password123');
  const ok = auth.login('dave_auth', 'password123');
  assert.equal(ok.user.username, 'dave_auth');
  assert.equal(auth.login('dave_auth', 'wrongpass').error, 'invalid_credentials');
  assert.equal(auth.login('nobody_auth', 'password123').error, 'invalid_credentials');
});

test('resumeSession returns null for an unknown token', () => {
  assert.equal(auth.resumeSession('not-a-real-token'), null);
});
