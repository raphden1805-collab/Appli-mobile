const crypto = require('node:crypto');
const { randomUUID } = require('node:crypto');
const { db } = require('./db');

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

function toPublicUser(row) {
  return { id: row.id, username: row.username };
}

function register(username, password) {
  const cleanUsername = (username || '').trim();
  if (!USERNAME_RE.test(cleanUsername)) {
    return { error: 'invalid_username' };
  }
  if (!password || password.length < 4) {
    return { error: 'invalid_password' };
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
  if (existing) {
    return { error: 'username_taken' };
  }

  const { hash, salt } = hashPassword(password);
  const info = db
    .prepare('INSERT INTO users (username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?)')
    .run(cleanUsername, hash, salt, Date.now());

  const user = { id: Number(info.lastInsertRowid), username: cleanUsername };
  return { user, token: createSession(user.id) };
}

function login(username, password) {
  const cleanUsername = (username || '').trim();
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);
  if (!row || !verifyPassword(password || '', row.password_hash, row.password_salt)) {
    return { error: 'invalid_credentials' };
  }
  const user = toPublicUser(row);
  return { user, token: createSession(user.id) };
}

function createSession(userId) {
  const token = randomUUID();
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, userId, Date.now());
  return token;
}

function resumeSession(token) {
  if (!token) return null;
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) return null;
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  return row ? toPublicUser(row) : null;
}

function getUserByUsername(username) {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get((username || '').trim());
  return row ? toPublicUser(row) : null;
}

function getUserById(id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return row ? toPublicUser(row) : null;
}

module.exports = { register, login, resumeSession, getUserByUsername, getUserById };
