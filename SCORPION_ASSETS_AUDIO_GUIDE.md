# ليلة العقارب — Card assets and ElevenLabs sound setup

## Poker cards
- Target physical proportion: **2.5 × 3.5 in**, equivalent to **5:7 width:height**.
- Production raster size: **750 × 1050 px** for both fronts and backs.
- Keep all updated role PNGs in: `assets/scurbion nights assets/`.
- **Back of every face-down card**: `17-card-back.png` (used for player seats, center cards, and the private reveal before opening).
- React Native UI uses `mobile/components/ScorpionPokerCard.js`. The card scales without cropping or changing the 5:7 ratio.
- Never expose hidden roles in public table props: the server sends face artwork only to the owning player or at final results.
- Replacing files of the same name requires only an Expo rebuild. Newly added files (including a restored role image) are discovered automatically by `node scripts/prepare-scorpion-cards.js`.
- Missing on 17 Oct 2026: **04-musaed.png** (المساعد). Leave the missing-art warning visible until the correct file is restored.

## Tomorrow: sound generation in ElevenLabs
Generate four separate effects, without speech or copyrighted music. Follow the instructions in `mobile/constants/scorpionSfx.js` (one exact production prompt per cue):

| Filename | Purpose | Length | Mode |
| --- | --- | --- | --- |
| `shuffle_cards.mp3` | Deck shuffle at the start of each new round | ~1.7 sec | Shared |
| `deal_card.mp3` | Papery impact as cards are dealt | ~0.3 sec | Shared |
| `flip_card.mp3` | Quick tactile card flip for private reveals and final results | ~0.38 sec | Private/public |
| `courtyard_ambience.mp3` | Quiet looping night courtyard sound bed | ~30 sec seamless loop | Shared |

Place the MP3s in `assets/scorpion-sfx/` then run:
```bash
npm run scorpion:audio:prepare
npm run scorpion:assets:prepare
npm run build:web
```
`npm run build:web` automatically refreshes both static asset maps. For native, run both preparation commands before starting a new Expo build.

The generated map is `mobile/constants/scorpionAudioSources.js`. Do **not** add ElevenLabs API keys to this app. Narrator voice scripts and paths remain at `mobile/constants/scorpionNarration.js`.

The sound system uses Expo Audio on web and native. It skips missing recordings safely, obeys the user's existing mute preference, and plays shared sounds only on the host device by default to avoid echo. The player can choose remote-audio mode to play shared audio on every device. It never changes the multiplayer game timers.
