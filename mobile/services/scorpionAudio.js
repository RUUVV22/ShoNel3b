// Audio adapter for recorded narration. No ElevenLabs SDK or secrets ship in the client.
// Register expo-audio players once matching MP3s have been added to the manifest.
const players=new Map();
const played=new Set();
export function registerScorpionNarration(id,player) {players.set(id,player);return()=>{if(players.get(id)===player)players.delete(id);};}
export async function playScorpionCue(cue,metadata) {
 if(!cue||!metadata)return;
 const token=cue.sequence+':'+cue.at+':'+cue.id;
 if(played.has(token))return;
 played.add(token);
 if(played.size>200)played.clear();
 // Ignore stale cues after reconnection; don't replay previous night announcements.
 if(Date.now()-cue.at>Math.max(5000,metadata.fallbackDurationMs+1500))return;
 const player=players.get(cue.id);
 if(!player)return; // Timed server phases continue without audio.
 try {await player.seekTo?.(0);player.play?.();}catch{}
}
