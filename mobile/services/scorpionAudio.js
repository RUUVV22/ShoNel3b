// Recorded Arabic narration. Audio players are created lazily to avoid allocating
// dozens of decoders when a room enters ليلة العقارب.
const players = new Map();
const factories = new Map();
const played = new Set();
import CUE_DURATIONS from '../../server/src/games/scorpionCueDurations.json';
import {setScorpionNarrationDucking,clearScorpionNarrationDucking} from './scorpionSfxPlayer';

export function registerScorpionNarration(id, player) {
  players.set(id, player);
  return () => { if (players.get(id) === player) players.delete(id); };
}

export function registerScorpionNarrationSource(id, source, createPlayer) {
  const factory = () => {
    const player = createPlayer(source);
    player.volume = 0.96;
    player.loop = false;
    return player;
  };
  factories.set(id, factory);
  return () => {
    if (factories.get(id) !== factory) return;
    factories.delete(id);
    const player = players.get(id);
    players.delete(id);
    try { player?.pause?.(); } catch {}
    try { player?.release?.(); } catch {}
  };
}

export function stopAllScorpionNarration() {
  clearScorpionNarrationDucking();
  for (const player of players.values()) {
    try { player.pause?.(); } catch {}
  }
}

export async function playScorpionCue(cue, metadata, serverClockOffsetMs=0) {
  if (!cue || !metadata) return false;
  // Never play obsolete role announcements after reconnecting.
  if (Date.now() + serverClockOffsetMs - cue.at > Math.max(5000, metadata.fallbackDurationMs + 1500)) return false;
  const token = cue.sequence + ':' + cue.at + ':' + cue.id;
  if (played.has(token)) return false;
  played.add(token);
  if (played.size > 200) played.clear();
  let player = players.get(cue.id);
  if (!player) {
    const factory = factories.get(cue.id);
    if (!factory) return false; // Missing recordings never block the game timer.
    try {
      player = factory();
      players.set(cue.id, player);
    } catch { return false; }
  }
  try {
    await player.seekTo?.(0);
    player.play?.();
    setScorpionNarrationDucking(CUE_DURATIONS[cue.id]||metadata.fallbackDurationMs);
    return true;
  } catch { return false; }
}
