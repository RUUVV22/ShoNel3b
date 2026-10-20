// Original ElevenLabs-generated Scorpion Night foley and ambience.
// Files are loaded only if present in assets/scorpion-sfx.
export const SCORPION_SFX = Object.freeze({
  shuffle_cards: { volume: 0.36, loop: false, scope: 'shared', event: 'start round' },
  deal_card: { volume: 0.23, loop: false, scope: 'shared', event: 'deal card' },
  flip_card: { volume: 0.29, loop: false, scope: 'private', event: 'reveal card' },
  courtyard_ambience: { volume: 0.09, loop: true, scope: 'shared', event: 'night ambience' },
  replace_card: { volume: 0.38, loop: false, scope: 'private', event: 'swap cards' },
  select_card: { volume: 0.28, loop: false, scope: 'private', event: 'select a card' },
  deselect_card: { volume: 0.25, loop: false, scope: 'private', event: 'unselect a card' },
  night_bell: { volume: 0.55, emphasis: true, loop: false, scope: 'shared', event: 'night begins' },
  role_wake: { volume: 0.27, loop: false, scope: 'shared', event: 'role wakes' },
  role_sleep: { volume: 0.25, loop: false, scope: 'shared', event: 'role sleeps' },
  secret_look: { volume: 0.30, loop: false, scope: 'private', event: 'secret card inspection' },
  dawn_transition: { volume: 0.53, emphasis: true, loop: false, scope: 'shared', event: 'dawn begins' },
  timer_warning: { volume: 0.32, loop: false, scope: 'shared', event: 'discussion warning' },
  vote_select: { volume: 0.32, loop: false, scope: 'private', event: 'select vote' },
  vote_confirm: { volume: 0.40, loop: false, scope: 'private', event: 'confirm vote' },
  results_reveal: { volume: 0.55, emphasis: true, loop: false, scope: 'shared', event: 'results reveal' },
  win_sting: { volume: 0.50, emphasis: true, loop: false, scope: 'shared', event: 'victory' },
  lose_sting: { volume: 0.44, emphasis: true, loop: false, scope: 'shared', event: 'no winner' },
  button_click: { volume: 0.22, loop: false, scope: 'private', event: 'confirm action' },
});
