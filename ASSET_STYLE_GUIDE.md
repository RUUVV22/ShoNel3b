# Sho Nel3b? — Asset & Art Style Guide

**Status:** Approved visual direction for all new game art, menus, logos and cards.
**Product:** شو نلعب؟ / Sho Nel3b?

This guide is the repository's shared visual contract. Before generating or changing art, look at the four existing illustrated game logos in `assets/game-logos/` as a matching set:

- `codenames_logo.png` — warm pulp mystery / card silhouettes and magnifier.
- `werewolf_logo.png` — theatrical night village, lanterns, scorpions, hand-lettered title.
- `khaserny_logo.png` — witty oversized question mark and six energetic icons.
- `meen_fajjarni_logo.png` — bold comic scene, characters, bomb, title plaque.

The mystery title **مين وراها** must look like **the fifth box on the same shelf**, not an unrelated flat badge.

## 1. Art direction

**Warm illustrated tabletop box art:** playful, expressive, lightly painterly, handcrafted paper/grain, lively scene, tactile shapes, thick plum line art and legible dimensional lettering. Mix friendly theatre, Arab-neighborhood mystery and collectable character cards. Modern interaction design, old-school poster/board-game charm.

Avoid generic neon, glossy plastic, hyperrealistic 3D, stock photographs, minimalist corporate icons, gambling/casino visuals, flat badges with no storytelling, or combining incompatible art render styles.

## 2. Non-negotiable palette

| Color | Hex | Intended use |
| --- | --- | --- |
| Plum | `#351326` | outlines, deep surfaces, frames, main title drop shadow |
| Coral | `#E75A3C` | expressive characters, bright emphasis, active areas |
| Mustard | `#F2B529` | title edging, warm highlights, secondary accent |
| Cream | `#FFF0CF` | parchment, card faces, lettering, readable light surfaces |

Muted warm browns, terracotta, dark purple variations and parchment gradients can provide lighting and depth. An accent outside the master palette is allowed *only* for a specific recognizable prop; do not make it a new dominant theme. Keep screens legible and sufficiently contrasting.

## 3. Composition and dimensions

**Game catalogue logos:**
- Canonical layout: **768 × 512 PNG (3:2)**, matching the original four game box illustrations.
- An illustrated setting, character(s) or thematic props should occupy at least half the canvas.
- Large Arabic title with heavy hand-drawn/plum outline, cream or mustard highlights, subtle extruded/offset shadow. Text should still read at **320 × 213** and in mobile game pickers.
- Short English subtitle in a smaller bold face only when space permits.
- A warm parchment frame, vignette or box edge makes the logos read as one family.
- Leave safe margins of about 5–7% for cropping and rounded tiles; never let title touch the edge.
- One clear central focal point; avoid busy background details competing with the name.

**UI cards & thumbnails:** strong silhouette, chunky corners, cream surfaces, plum strokes, tiny offset shadows and selective coral/mustard accents. Use 2x or 3x pixel-density art for high-DPI devices.

**Portraits:** original expressive illustrated humans and fantasy characters, varied age/faces/clothes/poses, consistent brush line and lighting. Recognizable at 64 px. Never reuse one generic portrait across different characters.

**Boards/environment:** illustrated 2D/isometric Arab village/neighborhood, warm stones, playful roofs, open streets, lanterns, functional walkable regions and clearly legible markers. Gameplay readability wins over decoration.

**Effects:** soft glow, brief bounce/lift, physical card flips and small dust/paper grain. Avoid heavy or strobing effects.

## 4. Typography and Arabic QA

Display lettering should be theatrical, rounded, groovy, thick and custom-looking. Body text should be neutral, accessible, highly readable Arabic/English. Never use tiny decorative fonts as the body copy.

Verify before shipping:
1. Arabic spelling, ligatures and proper right-to-left order.
2. The main title remains readable over the illustration.
3. English subtitle is genuinely subordinate.
4. Punctuation, counters and mixed-direction text do not reorder incorrectly.
5. No unnecessary generated text or accidental gibberish appears in backgrounds.

Prefer a legible hand-lettered title finished/checked manually over unreliable image-generated Arabic. Do not ship a logo with wrong Arabic letters.

## 5. Mystery game — مين وراها

**Title:** `مين وراها`
**Optional subtitle:** `WHO DID IT?`
**Mood:** warm theatrical detective story in a lively Arab neighborhood, friendly rather than horror.

**Approved visual composition:** an illustrated old-stone lane at dusk, hanging brass lanterns, arches and shutters, a distant suspicious silhouette, scattered clues/paper/map and one oversized magnifying glass. Title plaque in cream/gold and plum, matching the logo family. Coral and mustard highlights lead the eye. Keep enough negative space behind the letters.

Not approved: a simple purple rounded rectangle with plain text; hyperrealistic crime-scene photographs; generic police-badge logo; an unrelated minimalist app icon.

**Repository runtime mapping:** `mobile/components/GameLogo.js` maps `MEN_WARAHA` to `assets/mystery/logo.png`. The approved high-resolution original is `assets/mystery/logo_source.png` (1536×1024). Run `python scripts/generate-mystery-logo.py` to rebuild its 768×512 production version. Keep this mapping stable. Other mystery art lives in `assets/mystery/`.

## 6. Werewolf / ليلة العقارب

Use storybook illustrated fantasy/village costumes, strong expressive character diversity, parchment card frames and lantern-lit theatrical backgrounds. Sheriff of Nottingham can be a **broad tonal inspiration** (characterful illustrated board-game portraits), but **do not copy** its composition, logos, costumes, icons or character designs. Our original wolf, scorpion, scorpioness and villagers must be visually distinctive and readable.

Scorpion/scorpioness should look like matching factions with individually distinct visual motifs and color/pose accents, not a single duplicated portrait.

## 7. UI assets

- **Menus:** cream paper, plum framing and small coral/mustard playful motifs.
- **Cards:** warm cream face, thick plum border, subtle grain, chunky rounded corners, light offset drop shadow.
- **Panels:** plum on dark, cream on light; strong title hierarchy.
- **Buttons:** rounded, tactile, high contrast, large enough for mobile touch.
- **Avatar/role tiles:** collectible tabletop cards, distinct illustrated portraits, no playing-card suit symbols.
- **Notebook/evidence:** handwritten-paper aesthetic with clear evidence identity and uncluttered selection states.
- **Icons:** simple bold rounded silhouettes; visual weight consistent across tabs.

## 8. Generation prompt template

> Create one **original** illustrated tabletop party-game asset for **Sho Nel3b? / شو نلعب؟**, carefully matched to the established logo family (Codenames, Scorpion Night, Khaserny, Meen Fajjarni). Warm hand-painted storybook/comic treatment, light parchment texture, playful theatrical posing, chunky rounded silhouettes, bold plum outlines, layered warm lighting and dimensional groovy title treatment. Brand palette: Plum #351326, Coral #E75A3C, Mustard #F2B529, Cream #FFF0CF. Keep the subject clear at small mobile size, verify connected and correctly ordered Arabic writing, and avoid any copyrighted character or copied game logo.

For **مين وراها**, add: *Cozy Arab mystery alley, glowing lantern, archway suspect silhouette, magnifying glass and scattered clue notes; exact title “مين وراها”, small English “WHO DID IT?”; 3:2 landscape game-box tile.*

## 9. Approval checklist

- [ ] Matches all existing illustrated logos as one shelf/family
- [ ] Uses approved palette and a warm paper/paint texture
- [ ] Strong focal illustration; not merely flat lettering
- [ ] Distinct silhouette and readable Arabic at 320 × 213
- [ ] Accurate RTL and exact spelling
- [ ] Clean cropped safe margins, no missing art at rounded corners
- [ ] Correct export dimensions, optimized file size and alpha handling
- [ ] Not copying existing commercial artwork or characters
- [ ] Verified in the actual home game shelf AND lobby game picker on mobile/web
- [ ] Checked with a real build, not only generated in isolation

**When art or UI conflicts with these guidelines, prioritize readability, the four approved logo references, and the core palette.**
