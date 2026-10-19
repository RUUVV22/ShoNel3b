// ElevenLabs SFX production plan. No voice, dialogue, or music in these files.
// Add finished audio to assets/scorpion-sfx/ and run:
//   node scripts/prepare-scorpion-audio.js
// The adapter automatically skips missing clips without interrupting game timers.
export const SCORPION_SFX = Object.freeze({
  shuffle_cards: {
    id: 'shuffle_cards', filename: 'shuffle_cards.mp3', durationMs: 1700, volume: 0.65, loop: false,
    scope: 'shared', event: 'A new round starts and the face-down deck shuffles.',
    elevenLabsPrompt: 'Warm close-mic shuffle of thick illustrated paper playing cards on an antique wooden table: 2 quick riffles, a light deck cut, and a gentle soft paper tap. Natural tactile tabletop sound, no speech, no music, no harsh transients. Approximately 1.7 seconds.',
  },
  deal_card: {
    id: 'deal_card', filename: 'deal_card.mp3', durationMs: 300, volume: 0.5, loop: false,
    scope: 'shared', event: 'A face-down card moves from center to a seat.',
    elevenLabsPrompt: 'One thick paper playing card is dealt and slides a short distance over an old wooden tabletop, ending in a soft dry papery tap. Single isolated board-game sound, no voices or music. About 0.3 seconds.',
  },
  flip_card: {
    id: 'flip_card', filename: 'flip_card.mp3', durationMs: 380, volume: 0.6, loop: false,
    scope: 'private', event: 'A private starting card is revealed or publicly flipped at results.',
    elevenLabsPrompt: 'A single thick collectible paper playing card quickly flips in a hand and lands face up on wood: short clean flutter and satisfying papery snap. No voices or music. About 0.38 seconds.',
  },
  courtyard_ambience: {
    id: 'courtyard_ambience', filename: 'courtyard_ambience.mp3', durationMs: 30000,
    volume: 0.17, loop: true, scope: 'shared',
    event: 'Low-volume ambience underneath the landscape courtyard board.',
    elevenLabsPrompt: 'Seamlessly looping quiet nighttime courtyard ambience in an old Arab neighborhood: gentle evening breeze, distant crickets, faint lantern flame and rustling plants. Intimate warm calm atmosphere. No speech, no recognizable conversations, no melody or beats. Even loudness; 30 seconds, perfect seamless loop.',
  },
});
