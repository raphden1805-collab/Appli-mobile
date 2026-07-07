const { db } = require('./db');
const { getUserByUsername, getUserById } = require('./auth');

function sendFriendRequest(fromUserId, toUsername) {
  const target = getUserByUsername(toUsername);
  if (!target) return { error: 'user_not_found' };
  if (target.id === fromUserId) return { error: 'cannot_add_self' };

  const existingReverse = db
    .prepare(
      'SELECT * FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = ?'
    )
    .get(target.id, fromUserId, 'pending');

  if (existingReverse) {
    // L'autre nous avait deja envoye une demande : on l'accepte directement.
    db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?').run('accepted', existingReverse.id);
    return { ok: true, autoAccepted: true, friend: target };
  }

  const alreadyFriends = areFriends(fromUserId, target.id);
  if (alreadyFriends) return { error: 'already_friends' };

  try {
    db.prepare(
      'INSERT INTO friend_requests (from_user_id, to_user_id, status, created_at) VALUES (?, ?, ?, ?)'
    ).run(fromUserId, target.id, 'pending', Date.now());
  } catch (e) {
    return { error: 'request_already_sent' };
  }
  return { ok: true, autoAccepted: false, target };
}

function respondFriendRequest(requestId, userId, accept) {
  const request = db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(requestId);
  if (!request || request.to_user_id !== userId || request.status !== 'pending') {
    return { error: 'request_not_found' };
  }
  db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?').run(accept ? 'accepted' : 'declined', requestId);
  return { ok: true, fromUserId: request.from_user_id };
}

function areFriends(userIdA, userIdB) {
  const row = db
    .prepare(
      `SELECT 1 FROM friend_requests
       WHERE status = 'accepted'
         AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))`
    )
    .get(userIdA, userIdB, userIdB, userIdA);
  return Boolean(row);
}

function listFriends(userId) {
  const rows = db
    .prepare(
      `SELECT CASE WHEN from_user_id = ? THEN to_user_id ELSE from_user_id END AS friend_id
       FROM friend_requests
       WHERE status = 'accepted' AND (from_user_id = ? OR to_user_id = ?)`
    )
    .all(userId, userId, userId);
  return rows.map((r) => getUserById(r.friend_id)).filter(Boolean);
}

function listPendingRequests(userId) {
  const rows = db
    .prepare(`SELECT * FROM friend_requests WHERE to_user_id = ? AND status = 'pending'`)
    .all(userId);
  return rows.map((r) => ({ requestId: r.id, from: getUserById(r.from_user_id) })).filter((r) => r.from);
}

module.exports = { sendFriendRequest, respondFriendRequest, areFriends, listFriends, listPendingRequests };
