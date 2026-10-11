export const TEAM = Object.freeze({ RED: 'RED', BLUE: 'BLUE' });
export const ROLE = Object.freeze({ SPYMASTER: 'SPYMASTER', AGENT: 'AGENT' });
export const CARD = Object.freeze({
  RED: 'RED',
  BLUE: 'BLUE',
  NEUTRAL: 'NEUTRAL',
  ASSASSIN: 'ASSASSIN',
});
export const STATUS = Object.freeze({ LOBBY: 'LOBBY', ACTIVE: 'ACTIVE', FINISHED: 'FINISHED' });

export const TEAM_LABEL = Object.freeze({
  [TEAM.RED]: 'الفريق المرجاني',
  [TEAM.BLUE]: 'الفريق الذهبي',
});

export const ROLE_LABEL = Object.freeze({
  [ROLE.SPYMASTER]: 'قائد الفريق',
  [ROLE.AGENT]: 'لاعب',
});

export const RESULT_LABEL = Object.freeze({
  ALL_WORDS: 'اكتشف الفريق جميع كلماته',
  ASSASSIN: 'تم اختيار بطاقة الموت',
});
