import { useEffect } from 'react';
import { createAudioPlayer } from 'expo-audio';
import { SCORPION_AUDIO_SOURCES } from '../constants/scorpionAudioSources';
import { SCORPION_NARRATION_SOURCES } from '../constants/scorpionNarrationSources';
import { SCORPION_SFX } from '../constants/scorpionSfx';
import { registerScorpionNarrationSource } from '../services/scorpionAudio';
import { registerScorpionSfx, stopAllScorpionSfx } from '../services/scorpionSfxPlayer';

// Mount once per game screen: narration is lazy, while short shared SFX
// players are ready for timely reactions. Missing MP3s never affect gameplay.
export function ScorpionAudioLayer() {
  useEffect(() => {
    const releases = [];
    for (const [id, source] of Object.entries(SCORPION_NARRATION_SOURCES)) {
      releases.push(registerScorpionNarrationSource(id, source, createAudioPlayer));
    }
    for (const [id, source] of Object.entries(SCORPION_AUDIO_SOURCES)) {
      let player;
      try {
        player = createAudioPlayer(source);
        player.volume = SCORPION_SFX[id]?.volume ?? 0.6;
        player.loop = Boolean(SCORPION_SFX[id]?.loop);
        releases.push(registerScorpionSfx(id, player));
        releases.push(() => { player.pause?.(); player.release?.(); });
      } catch { try { player?.release?.(); } catch {} }
    }
    return () => {
      stopAllScorpionSfx();
      releases.forEach(release => release());
    };
  }, []);
  return null;
}
