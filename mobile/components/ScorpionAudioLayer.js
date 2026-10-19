import { useEffect } from 'react';
import { createAudioPlayer } from 'expo-audio';
import { SCORPION_AUDIO_SOURCES } from '../constants/scorpionAudioSources';
import { SCORPION_SFX } from '../constants/scorpionSfx';
import { registerScorpionSfx, stopAllScorpionSfx } from '../services/scorpionSfxPlayer';

// Holds players only while Scorpion Night is mounted. Missing recordings cause no
// requests and no silence timers; gameplay still follows authoritative deadlines.
export function ScorpionAudioLayer() {
  useEffect(() => {
    const releases = [];
    for (const [id, source] of Object.entries(SCORPION_AUDIO_SOURCES)) {
      let player;
      try {
        player = createAudioPlayer(source);
        player.volume = SCORPION_SFX[id]?.volume ?? 0.6;
        player.loop = Boolean(SCORPION_SFX[id]?.loop);
        releases.push(registerScorpionSfx(id, player));
        releases.push(() => { player.pause?.(); player.release?.(); });
      } catch {
        player?.release?.();
      }
    }
    return () => { stopAllScorpionSfx(); releases.forEach(release => release()); };
  }, []);
  return null;
}
