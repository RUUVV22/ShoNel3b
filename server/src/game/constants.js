const TEAM = Object.freeze({
  RED: 'RED',
  BLUE: 'BLUE',
});

const ROLE = Object.freeze({
  SPYMASTER: 'SPYMASTER',
  AGENT: 'AGENT',
});

const CARD = Object.freeze({
  RED: 'RED',
  BLUE: 'BLUE',
  NEUTRAL: 'NEUTRAL',
  ASSASSIN: 'ASSASSIN',
});

const STATUS = Object.freeze({
  LOBBY: 'LOBBY',
  ACTIVE: 'ACTIVE',
  FINISHED: 'FINISHED',
});

const RESULT_REASON = Object.freeze({
  ALL_WORDS: 'ALL_WORDS',
  ASSASSIN: 'ASSASSIN',
});

module.exports = {
  TEAM,
  ROLE,
  CARD,
  STATUS,
  RESULT_REASON,
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 20,
};
