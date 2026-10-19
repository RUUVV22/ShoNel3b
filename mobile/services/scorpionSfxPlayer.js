// Reusable game-specific playback without inventing audio before ElevenLabs exports.
const players = new Map();

export function registerScorpionSfx(id, player) {
  players.set(id, player);
  return () => { if (players.get(id) === player) players.delete(id); };
}

export function playScorpionSfx(id) {
  const player = players.get(id);
  if (!player) return false;
  try {
    // Do not await seek: browsers require playback to begin in the user gesture.
    if (id !== 'courtyard_ambience') player.seekTo?.(0)?.catch?.(() => {});
    player.play?.();
    return true;
  } catch { return false; }
}

export function stopScorpionSfx(id) {
  try { players.get(id)?.pause?.(); } catch {}
}

export function stopAllScorpionSfx() {
  for (const id of players.keys()) stopScorpionSfx(id);
}
