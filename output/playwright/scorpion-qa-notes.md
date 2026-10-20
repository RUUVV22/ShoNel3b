# ليلة العقارب — QA notes (2026-10-20)

## Validation
- npm test: 61 passed, 0 failed. Includes 20 dedicated Scorpion Night cases plus party-game, stability and multiplayer coverage.
- npm run build:web: passed. 19 SFX and 56 narration sources found; one missing card illustration.
- Live local session: four players (one browser host, three Socket.IO simulated friends). Browser checked on desktop, 844×390 landscape, and 390×844 portrait.
- No browser runtime errors observed; four React Native Web deprecation/fallback warnings.

## Findings
1. HIGH — Lone scorpion abilities unavailable in UI. Reproduced as العقربة with no partner: all middle cards disabled; only acknowledgement offered. WerewolfScreen.js:121 assigns activeRole to SCORPIONS, while target selection expects SCORPION/SCORPIONESS. This also affects the lone العقرب branch. Server ability tests pass, exposing a gap in UI coverage.
2. MEDIUM — المساعد artwork missing. Setup visibly renders الرسم مفقود; generated source registry lists 04-musaed.png missing.
3. MEDIUM (code inspection) — Scorpioness comparison text is formatted as a role ID. Memory.describe passes نفس الفريق / فريقان مختلفان through roleTitle, whose fallback is بطاقة مخفية. Comparison results will therefore lose their meaning even after target selection is repaired.
4. UX note — Reveal auto-advances after 20 seconds even if someone has not acknowledged their card. Confirm whether this is intended for new players.
5. UX note — Portrait blocks play and requires landscape. Landscape was visually readable at 844×390.

## Limits
- Native Android/iOS behavior and audible narration quality were not verified.
- Automated tests cover role variants, ties, hunter chains, tanner outcomes, privacy, reconnect and replay; these are not all manually exercised through browser UI.
- No game source fixes made; findings left for review.

## Completed live round
Card selection → private reveal → all night timers → discussion and private memory → unanimous early vote → select/confirm vote → results, final cards, votes and recap → return to lobby verified. Village won after Islam (final Scorpioness) received three votes. Fresh review room: VDNZE, at card selection with three simulated friends; app at http://localhost:8081.

