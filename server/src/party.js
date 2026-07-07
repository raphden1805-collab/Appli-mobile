const { randomUUID } = require('node:crypto');

const MAX_PARTY_SIZE = 3;

const parties = new Map(); // partyId -> { id, members: [{id,username,socketId}] }
const memberOf = new Map(); // userId -> partyId
const pendingInvites = new Map(); // targetUserId -> { partyId, fromUserId, fromUsername }

function getParty(userId) {
  const partyId = memberOf.get(userId);
  return partyId ? parties.get(partyId) : null;
}

function getOrCreateParty(user) {
  const existing = getParty(user.id);
  if (existing) return existing;
  const party = { id: randomUUID(), members: [{ id: user.id, username: user.username, socketId: user.socketId }] };
  parties.set(party.id, party);
  memberOf.set(user.id, party.id);
  return party;
}

function invite(fromUser, targetUser) {
  if (fromUser.id === targetUser.id) return { error: 'cannot_invite_self' };
  const party = getOrCreateParty(fromUser);
  if (party.members.length >= MAX_PARTY_SIZE) return { error: 'party_full' };
  if (party.members.some((m) => m.id === targetUser.id)) return { error: 'already_in_party' };
  if (getParty(targetUser.id)) return { error: 'target_in_party' };

  pendingInvites.set(targetUser.id, { partyId: party.id, fromUserId: fromUser.id, fromUsername: fromUser.username });
  return { ok: true, party };
}

function respondInvite(user, accept) {
  const pending = pendingInvites.get(user.id);
  if (!pending) return { error: 'no_invite' };
  pendingInvites.delete(user.id);
  if (!accept) return { ok: true, declined: true };

  const party = parties.get(pending.partyId);
  if (!party || party.members.length >= MAX_PARTY_SIZE) return { error: 'party_full' };

  party.members.push({ id: user.id, username: user.username, socketId: user.socketId });
  memberOf.set(user.id, party.id);
  return { ok: true, party };
}

function leaveParty(userId) {
  const party = getParty(userId);
  if (!party) return null;
  party.members = party.members.filter((m) => m.id !== userId);
  memberOf.delete(userId);
  if (party.members.length === 0) parties.delete(party.id);
  return party;
}

function disband(partyId) {
  const party = parties.get(partyId);
  if (!party) return;
  for (const m of party.members) memberOf.delete(m.id);
  parties.delete(partyId);
}

function updateSocket(userId, socketId) {
  const party = getParty(userId);
  const member = party && party.members.find((m) => m.id === userId);
  if (member) member.socketId = socketId;
}

function getPendingInviteFor(userId) {
  return pendingInvites.get(userId) || null;
}

module.exports = {
  MAX_PARTY_SIZE,
  getParty,
  invite,
  respondInvite,
  leaveParty,
  disband,
  updateSocket,
  getPendingInviteFor,
};
