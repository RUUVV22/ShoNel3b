const { STATUS } = require('../game/constants');
const { GameError } = require('../game/errors');

const metadata = {
  id: 'BOMB',
  title: 'مين فجّرني؟',
  englishTitle: 'WHO BOMBED ME?',
  subtitle: 'مرّر القنبلة... وخليك مجهول',
  description: 'واحد معه القنبلة، يبعثها بالسر. هل الضحية بتعرف مين ورّطها؟',
  minPlayers: 4,
  maxPlayers: 20,
};

function pickRandom(items, random) {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

function canStart(room) {
  const count = room.players.filter(player => player.connected).length;
  return count >= metadata.minPlayers && count <= metadata.maxPlayers;
}

function createSession(round, random = Math.random, room) {
  const aliveIds = room.players.filter(player => player.connected).map(player => player.id);
  if (aliveIds.length < metadata.minPlayers) throw new GameError('NOT_READY');
  return {
    status: STATUS.ACTIVE,
    round,
    phase: 'PASS',
    aliveIds,
    eliminatedIds: [],
    bombHolderId: pickRandom(aliveIds, random),
    targetId: null,
    guessedId: null,
    lastResult: null,
    winnerId: null,
    turnsPlayed: 0,
  };
}

function act(session, player, payload, random = Math.random) {
  const { action, targetId } = payload || {};
  if (session.phase !== 'REVEAL' && !session.aliveIds.includes(player.id)) throw new GameError('PLAYER_ELIMINATED');

  if (session.phase === 'PASS') {
    if (action !== 'pass' || player.id !== session.bombHolderId) throw new GameError('NOT_YOUR_TURN');
    if (!session.aliveIds.includes(targetId) || targetId === player.id) throw new GameError('INVALID_TARGET');
    session.targetId = targetId;
    session.phase = 'GUESS';
    return;
  }
  if (session.phase === 'GUESS') {
    if (action !== 'guess' || player.id !== session.targetId) throw new GameError('NOT_YOUR_TURN');
    if (!session.aliveIds.includes(targetId) || targetId === player.id) throw new GameError('INVALID_TARGET');

    const senderId = session.bombHolderId;
    const correct = targetId === senderId;
    const eliminatedId = correct ? senderId : player.id;
    session.guessedId = targetId;
    session.aliveIds = session.aliveIds.filter(id => id !== eliminatedId);
    session.eliminatedIds.push(eliminatedId);
    session.turnsPlayed++;
    session.lastResult = { senderId, recipientId: player.id, guessedId: targetId, eliminatedId, correct };
    session.phase = session.aliveIds.length === 1 ? 'FINISHED' : 'REVEAL';

    if (session.phase === 'FINISHED') {
      session.winnerId = session.aliveIds[0];
      session.status = STATUS.FINISHED;
    }
    return;
  }
  if (session.phase === 'REVEAL') {
    if (action !== 'next') throw new GameError('INVALID_GAME_ACTION');
    session.round++;
    session.phase = 'PASS';
    session.bombHolderId = pickRandom(session.aliveIds, random);
    session.targetId = null;
    session.guessedId = null;
    session.lastResult = null;
    return;
  }
  throw new GameError('GAME_NOT_ACTIVE');
}

function recover(session, room) {
  const waitingId = session.phase === 'PASS' ? session.bombHolderId :
    session.phase === 'GUESS' ? session.targetId : null;
  if (!waitingId || room.players.some(p => p.id === waitingId && p.connected))
    throw new GameError('RECOVERY_NOT_NEEDED');
  // The host explicitly forfeits a disconnected player's place so everyone
  // else can finish the round, without exposing the hidden bomber early.
  const senderId = session.bombHolderId;
  const recipientId = session.targetId;
  session.aliveIds = session.aliveIds.filter(id => id !== waitingId);
  session.eliminatedIds.push(waitingId);
  session.lastResult = { senderId, recipientId, guessedId: null,
    eliminatedId: waitingId, correct: false, disconnected: true };
  session.turnsPlayed++;
  session.phase = session.aliveIds.length === 1 ? 'FINISHED' : 'REVEAL';
  if (session.phase === 'FINISHED') {
    session.winnerId = session.aliveIds[0];
    session.status = STATUS.FINISHED;
  }
}
function serialize(session, viewer, room) {
  const id = viewer.id;
  const alive = session.aliveIds.includes(id);
  const isHolder = alive && session.bombHolderId === id && session.phase === 'PASS';
  const isRecipient = alive && session.targetId === id && session.phase === 'GUESS';
  return { bomb: {
    phase: session.phase,
    round: session.round,
    totalPlayers: session.aliveIds.length + session.eliminatedIds.length,
    aliveIds: [...session.aliveIds],
    eliminatedIds: [...session.eliminatedIds],
    isHolder,
    isRecipient,
    // Sender identity must not leave the server before the answer is revealed.
    bombHolderId: isHolder ? id : undefined,
    recipientId: session.phase === 'GUESS' ? session.targetId : undefined,
    lastResult: session.phase === 'REVEAL' || session.phase === 'FINISHED' ? session.lastResult : null,
    winnerId: session.winnerId,
    turnsPlayed: session.turnsPlayed,
    canAct: isHolder || isRecipient,
    waitingForDisconnected: Boolean(room && (session.phase === 'PASS' || session.phase === 'GUESS') &&
      !room.players.some(p => p.id === (session.phase === 'PASS' ? session.bombHolderId : session.targetId) && p.connected)),
  } };
}

module.exports = { metadata, canStart, createSession, act, recover, serialize };
