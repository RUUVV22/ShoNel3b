const { createBoard, normalizeArabic } = require('../game/gameEngine');
const { TEAM, ROLE, CARD, STATUS, RESULT_REASON, MIN_PLAYERS, MAX_PLAYERS } = require('../game/constants');
const { GameError } = require('../game/errors');

const metadata = Object.freeze({
  id: 'CODENAMES',
  title: 'كود نيمز',
  englishTitle: 'Codenames',
  subtitle: 'لعبة الكلمات والجواسيس',
  description: 'فريقان، ٢٥ كلمة، وتلميحة واحدة تغيّر كل شيء',
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,
});

function canStart(room) {
  const connected = room.players.filter(p => p.connected);
  return connected.length >= MIN_PLAYERS && connected.length <= MAX_PLAYERS && Object.values(TEAM).every(team =>
    connected.some(p => p.team === team && p.role === ROLE.SPYMASTER) &&
    connected.some(p => p.team === team && p.role === ROLE.AGENT)
  );
}
function createSession(round, random = Math.random) {
  const { cards, startingTeam } = createBoard(random);
  return {
    status: STATUS.ACTIVE, board: cards, startingTeam, currentTeam: startingTeam,
    clue: null, clueHistory: [], guessesRemaining: 0,
    remainingCards: { [TEAM.RED]: cards.filter(c => c.type === TEAM.RED).length,
      [TEAM.BLUE]: cards.filter(c => c.type === TEAM.BLUE).length },
    winner: null, resultReason: null, round,
  };
}
function assertActive(session) {
  if (!session || session.status !== STATUS.ACTIVE) throw new GameError('GAME_NOT_ACTIVE');
}
function giveClue(session, player, word, count) {
  assertActive(session);
  if (player.team !== session.currentTeam) throw new GameError('NOT_YOUR_TURN');
  if (player.role !== ROLE.SPYMASTER) throw new GameError('SPYMASTER_ONLY');
  if (session.clue) throw new GameError('CLUE_EXISTS');
  const cleanWord = String(word || '').trim();
  const cleanCount = Number(count);
  if (!/^[\u0600-\u06FF]+$/u.test(cleanWord) || cleanWord.length > 24 ||
      !Number.isInteger(cleanCount) || cleanCount < 1 || cleanCount > 9) throw new GameError('INVALID_CLUE');
  if (session.board.some(c => !c.revealed && normalizeArabic(c.word) === normalizeArabic(cleanWord)))
    throw new GameError('CLUE_MATCHES_CARD');
  session.clue = { word: cleanWord, count: cleanCount, team: session.currentTeam,
    givenBy: player.id, createdAt: Date.now() };
  session.clueHistory.push({ ...session.clue });
  session.guessesRemaining = cleanCount + 1;
}
function switchTurn(session) {
  session.currentTeam = session.currentTeam === TEAM.RED ? TEAM.BLUE : TEAM.RED;
  session.clue = null;
  session.guessesRemaining = 0;
}
function finishRound(session, winner, reason) {
  session.status = STATUS.FINISHED;
  session.winner = winner;
  session.resultReason = reason;
  session.clue = null;
  session.guessesRemaining = 0;
}
function selectCard(session, player, cardId) {
  assertActive(session);
  if (player.team !== session.currentTeam) throw new GameError('NOT_YOUR_TURN');
  if (player.role !== ROLE.AGENT) throw new GameError('AGENT_ONLY');
  if (!session.clue) throw new GameError('CLUE_REQUIRED');
  const card = session.board.find(c => c.id === cardId);
  if (!card || card.revealed) throw new GameError('INVALID_CARD');
  card.revealed = true;
  card.revealedBy = player.id;
  const selectingTeam = session.currentTeam;
  const otherTeam = selectingTeam === TEAM.RED ? TEAM.BLUE : TEAM.RED;
  let turnEnded = false;
  if (card.type === CARD.ASSASSIN) {
    finishRound(session, otherTeam, RESULT_REASON.ASSASSIN);
  } else if (card.type === selectingTeam) {
    session.remainingCards[selectingTeam] -= 1;
    if (session.remainingCards[selectingTeam] === 0)
      finishRound(session, selectingTeam, RESULT_REASON.ALL_WORDS);
    else if (--session.guessesRemaining <= 0) {
      switchTurn(session); turnEnded = true;
    }
  } else if (card.type === otherTeam) {
    session.remainingCards[otherTeam] -= 1;
    if (session.remainingCards[otherTeam] === 0)
      finishRound(session, otherTeam, RESULT_REASON.ALL_WORDS);
    else { switchTurn(session); turnEnded = true; }
  } else { switchTurn(session); turnEnded = true; }
  return { revealedType: card.type, turnEnded };
}
function endTurn(session, player) {
  assertActive(session);
  if (player.team !== session.currentTeam) throw new GameError('NOT_YOUR_TURN');
  if (player.role !== ROLE.AGENT) throw new GameError('AGENT_ONLY');
  if (!session.clue) throw new GameError('CLUE_REQUIRED');
  switchTurn(session);
}
function serialize(session, viewer) {
  if (!session) return {};
  const seesHiddenBoard = viewer.role === ROLE.SPYMASTER;
  return {
    currentTeam: session.currentTeam,
    startingTeam: session.startingTeam,
    board: session.board.map(card => ({
      id: card.id, word: card.word, revealed: card.revealed, revealedBy: card.revealedBy,
      type: card.revealed || seesHiddenBoard ? card.type : null,
    })),
    clue: session.clue ? {
      word: session.clue.word, count: session.clue.count,
      team: session.clue.team, givenBy: session.clue.givenBy,
    } : null,
    clueHistory: session.clueHistory.map(clue => ({
      word: clue.word, count: clue.count, team: clue.team, givenBy: clue.givenBy,
    })),
    guessesRemaining: session.guessesRemaining, remainingCards: { ...session.remainingCards },
    winner: session.winner, resultReason: session.resultReason, round: session.round,
  };
}
module.exports = { metadata, canStart, createSession, giveClue, selectCard, endTurn, serialize };
